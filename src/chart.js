const fs = require('fs');
const util = require('util');
const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
const QuickChart = require('quickchart-js');
const config = require('../conf/config.js');
const utils = require('./utils');

class Chart {
    constructor () {
      this.version = '0.1.0';  
    }

    async sql01 (client, from, DB) {
            // Consulta para calcular a taxa de conversão
            const orderCount = await DB.Message.count({
                where: {
                body: '5' // Mensagens com body igual a 5 representam pedidos
                }
            });
        
            // Consulta para contar o número de números de telefone únicos na tabela `contacts` que têm pedidos
            const uniqueNumbersWithOrdersCount = await DB.Contacts.count({
                where: {
                whatsappNumber: {
                    [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT sender FROM messages WHERE body = '5')`)
                }
                }
            });
            // Calcular a taxa de conversão
            const conversionRate = (uniqueNumbersWithOrdersCount / orderCount) * 100;
            return this.cGraph(client, from, conversionRate.toFixed(2));
    }

    async sql01a (client, from, DB) {
          // Obter a data de início e fim do mês atual (outubro)
          const currentDate = new Date();
          const startOfMonth = new Date(currentDate.getFullYear(), 9, 1); // O mês de outubro é representado como 9 (0-indexed) em JavaScript
          const endOfMonth = new Date(currentDate.getFullYear(), 10, 0);
  
          // Consulta para calcular a taxa de conversão
          const orderCount = await DB.Message.count({
              where: {
                  body: '5', // Mensagens com body igual a 5 representam pedidos
                  timestamp: {
                      [Op.between]: [startOfMonth, endOfMonth] // Filtrar pelo mês de outubro
                  }
              }
          });
  
          // Consulta para contar o número de números de telefone únicos na tabela `contacts` que têm pedidos
          const uniqueNumbersWithOrdersCount = await DB.Contacts.count({
              where: {
                  whatsappNumber: {
                      [Op.in]: [
                          Sequelize.literal(`SELECT DISTINCT sender FROM messages WHERE body = '5' AND timestamp BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}'`)
                      ]
                  }
              }
          });
  
          // Calcular a taxa de conversão
          const conversionRate = (uniqueNumbersWithOrdersCount / orderCount) * 100;
          return this.cGraph(client, from, conversionRate.toFixed(2));
  }

  // Função para contar mensagens recebidas por dia nos últimos sete dias
  async sql02(client, from, DB) {
    try {
      // Data de hoje
      const today = new Date();

      // Data de sete dias atrás
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6); // Subtrai 6 dias para obter os últimos 7 dias

      // Consulta para contar mensagens recebidas por dia nos últimos sete dias
      const result = await DB.Message.findAll({
        attributes: [
          [DB.sequelize.fn('date', DB.sequelize.col('timestamp')), 'date'], // Extrai a data da coluna timestamp
          [DB.sequelize.fn('count', DB.sequelize.col('*')), 'messageCount'], // Conta o número de mensagens
        ],
        where: {
          timestamp: {
            [Op.between]: [sevenDaysAgo, today], // Filtra por datas nos últimos sete dias
          },
        },
        group: ['date'], // Agrupa por data
        order: [['date', 'ASC']], // Ordena por data
      });

      // Resultado será um array de objetos com 'date' e 'messageCount'

      // Mapeie os nomes dos dias
      const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

      // Formate o resultado com o nome do dia
      const formattedResult = result.map((row) => ({
        dayName: daysOfWeek[new Date(row.getDataValue('date')).getDay()], // Nome do dia
        messageCount: row.getDataValue('messageCount'), // Contagem de mensagens
      }));

      this.dGraph(client, from, formattedResult, 'Mensagens processadas por dia');
    } catch (error) {
      console.error('Erro ao contar mensagens recebidas por dia:', error);
    }
  }

  async sql03(client, from, db) { 

  }

  async sql04(client, from, db) { 
    
  }

  async sql05(client, from, db) { 
    
  }

  async sql06(client, from, db) { 
    
  }

  async dGraph(client, from, data, title) {

    let fName = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    // Separe os nomes dos dias e as contagens de mensagens em arrays separados
    const labels = data.map((item) => item.dayName);
    const messageCounts = data.map((item) => item.messageCount);
  
    // Calcula o total de mensagens
    const totalMessages = messageCounts.reduce((acc, count) => acc + count, 0);
  
    // Configure o gráfico de rosquinha personalizado
    const chart = new QuickChart();
  
    chart
      .setConfig({
        type: 'doughnut', // Tipo de gráfico: "doughnut"
        data: {
          labels: labels,
          datasets: [
            {
              data: messageCounts,
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(0, 128, 0, 0.7)',
              ],
            },
          ],
        },
        options: {
          plugins: {
            doughnutlabel: {
              labels: [{ text: `${totalMessages}`, font: { size: 20, weight: 'bold' } }, { text: 'total' }],
            },
          },
          legend: {
            display: true,
            position: 'bottom', // Posição da legenda
          },
          title: {
            display: true,
            text: title, // Texto do título
            font: {
              size: 22,
              weight: 'bold'
            },
            position: 'top', // Posição do título
          },
        },
      })
      .setWidth(600)
      .setHeight(400);

    try {
      const fN = path.join(__dirname, '..', 'img', config.chartDir, `${fName}.png`);  
      const chartImage = await chart.toFile(fN);
      await client.sendImage(from, fN, `${title}: ${totalMessages}.`);
      if (config.showLog === true) console.log(`${title}: ${totalMessages}.`);
    } catch (error) {
      console.error('Erro ao criar o gráfico:', error);
    }
  }

  async cGraph (client, from, num) {
    let chart01 = new QuickChart();

    let fName = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    chart01.setWidth(500);
    chart01.setHeight(150);
    chart01.setVersion('3');
        
    chart01.setConfig({
      type: 'bar',
        data: {
          labels: ['Q1'],
          datasets: [{
            label: 'Conversão',
            data: [100],
            backgroundColor: QuickChart.getGradientFillHelper('horizontal', [
              'green',
              'yellow',
              'orange',
              'red',
            ]),
          },
        ],
      },
      options: {
        indexAxis: 'y',
          layout: {
            padding: 40,
          },
          scales: {
            x: {
              display: false,
            },
            y: {
              display: false,
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            annotation: {
              clip: false,
              common: {
                drawTime: 'afterDraw',
              },
              annotations: {
                low: {
                  type: 'label',
                  xValue: 4,
                  content: ['Baixa'],
                  font: {
                    size: 18,
                    weight: 'bold',
                  },
                },
                medium: {
                  type: 'label',
                  xValue: 50,
                  content: ['Média'],
                  font: {
                    size: 18,
                    weight: 'bold',
                  },
                },
                high: {
                  type: 'label',
                  xValue: 95,
                  content: ['Alta'],
                  font: {
                    size: 18,
                    weight: 'bold',
                  },
                },
                arrow: {
                  type: 'point',
                  pointStyle: 'triangle',
                  backgroundColor: '#000',
                  radius: 15,
                  xValue: num,
                  yAdjust: 65,
                },
                label1: {
                  type: 'label',
                  xValue: num,
                  yAdjust: 95,
                  content: ['Conversão:', `${num}%`],
                  font: {
                    size: 18,
                    weight: 'bold',
                  },
                },
              },
            },
          },
        },
      });
      try {
        const fN = path.join(__dirname, '..', 'img', config.chartDir, `${fName}.png`);  
        const chartImage01 = await chart01.toFile(fN);
        await client.sendImage(from, fN, `Taxa de Conversão de Clientes: ${num}%`);
        if (config.showLog === true) console.log(`Taxa de Conversão de Clientes: ${num}`);
      } catch (error) {
        console.error('Erro ao criar o gráfico:', error);
      }
    }
}

module.exports = Chart;