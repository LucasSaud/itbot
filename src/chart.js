const fs = require('fs');
const util = require('util');
const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
const QuickChart = require('quickchart-js');
const config = require('../conf/config.js');
const utils = require('./utils');


const currentMonth = () => {
  const currentDate = new Date();
  return currentDate.getMonth() + 1;
}

const nextMonth = () => {
  return currentMonth() + 1;
}

const startDate = currentMonth();
const endDate = nextMonth();

class Chart {
  constructor() {
    this.version = '0.2.0';
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
    const startOfMonth = new Date(currentDate.getFullYear(), startDate, 1); // O mês de outubro é representado como 9 (0-indexed) em JavaScript
    const endOfMonth = new Date(currentDate.getFullYear(), endDate, 0);
  

    // Consulta para calcular a taxa de conversão
    const orderCount = await DB.Message.count({
      where: {
        body: '5', // Mensagens com body igual a 5 representam pedidos
        timestamp: {
          [Sequelize.Op.between]: [startOfMonth, endOfMonth] // Filtrar pelo mês de outubro
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
          [DB.sequelize.fn('count', DB.sequelize.col('*')), 'count'], // Conta o número de mensagens
        ],
        where: {
          timestamp: {
            [Sequelize.Op.between]: [sevenDaysAgo, today], // Filtra por datas nos últimos sete dias
          },
        },
        group: ['date'], // Agrupa por data
        order: [['date', 'ASC']], // Ordena por data
      });
  
      if (config.showLog === true) console.log('Resultado da consulta em sql02:', result);
  
      // Verifique se a consulta retornou resultados
      if (result && result.length > 0) {
        // Formate o resultado com o nome do dia
        const formattedResult = result.map((row) => ({
          name: config.diasSemana[new Date(row.dataValues.date).getDay()], // Nome do dia
          count: parseInt(row.dataValues.count), // Contagem de mensagens (certifique-se de que seja um número)
        }));
  
        // Agora, formattedResult deve conter os dados no formato correto
  
        // Chame a função para criar o gráfico
        this.dGraph(client, from, formattedResult, 'Mensagens processadas por dia');
      } else {
        console.log('A consulta não retornou resultados.');
      }
    } catch (error) {
      console.error('Erro ao contar mensagens recebidas por dia:', error);
    }
  }
  

  async sql03(client, from, DB) { 
    // Data de hoje
    const today = new Date();

    // Data de sete dias atrás
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // Subtrai 6 dias para obter os últimos 7 dias

    const result = await DB.Message.findAll({
      attributes: [
        [DB.sequelize.fn('DATE', DB.sequelize.col('timestamp')), 'date'],
        [DB.sequelize.fn('COUNT', DB.sequelize.fn('DISTINCT', DB.sequelize.col('sender'))), 'count']
      ],
      where: {
        timestamp: {
          [Sequelize.Op.between]: [sevenDaysAgo, today],
        },
      },
      group: [DB.sequelize.fn('DATE', DB.sequelize.col('timestamp'))],
      raw: true,
    });

    // Formate o resultado com o nome do dia
    let row = null;
    const formattedResult = result.map((row) => ({
      name: config.diasSemana[new Date(row.date).getDay()], // Nome do dia
      count: row.count, // Contagem de mensagens
    }));
    this.dGraph(client, from, formattedResult, 'Atendimentos por dia');
  }

  async sql04(client, from, DB) { 
    // Obter dados de utilização de comandos
    const result = await DB.Message.findAll({
      attributes: [
          'body',
          [DB.sequelize.fn('COUNT', DB.sequelize.col('body')), 'count'],
        ],
        where: {
          body: {
            [Sequelize.Op.regexp]: '^[1-8]$',
          },
        },
        group: 'body',
        raw: true
      });

      const commandMapping = {
        1: 'Horários de Funcionamento',
        2: 'Cardápio',
        3: 'Nossa Localização',
        4: 'Tempo para Entregar',
        5: 'Fazer um Pedido',
        6: 'Opções de Pagamento',
        7: 'Opções de Consumo/Entrega',
        8: 'Falar com um Atendente',
      };
      
      let row = null; // inicia a variavel com valor nullo

      // Formate o resultado com o nome do dia
      const formattedResult = result.map((row) => ({
        name: commandMapping[row.body], // Nome do comando
        count: row.count, // Contagem de mensagens
      }));
      this.dGraph(client, from, formattedResult, 'Utilização dos comandos');
    }

    async sql05(client, from, DB) { 
      const result = await DB.Message.findAll({
        attributes: [
          [DB.sequelize.fn('DATE_FORMAT', DB.sequelize.col('timestamp'), '%M'), 'month'], // Formata a data para o nome do mês
          [DB.sequelize.fn('COUNT', DB.sequelize.fn('DISTINCT', DB.sequelize.col('sender'))), 'count']
        ],
        group: [DB.sequelize.fn('DATE_FORMAT', DB.sequelize.col('timestamp'), '%M')],
        raw: true,
      });
      if (result.length > 0) {
        // Formate o resultado com o nome do mês
        const formattedResult = result.map((row) => ({
          name: row.month, // Nome do mês
          count: row.count, // Contagem de mensagens
        }));
        this.dGraph(client, from, formattedResult, 'Atendimentos por Mês');
      } else {
        console.error('Nenhum dado retornado pela consulta de atendimentos mensais.');
      }
    }

    async dGraph(client, from, data, title) {

      
      let fName = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

      // Separe os nomes dos dias e as contagens de mensagens em arrays separados
      const labels = data.map((item) => item.name);
      const counts = data.map((item) => item.count);
    
      // Calcula o total de mensagens
      const total = counts.reduce((acc, count) => acc + count, 0);
    
      // Configure o gráfico de rosquinha personalizado
      const chart = new QuickChart();
    
      chart
        .setConfig({
          type: 'doughnut', // Tipo de gráfico: "doughnut"
          data: {
            labels: labels,
            datasets: [
              {
                data: counts,
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
                labels: [{ text: `${total}`, font: { size: 20, weight: 'bold' } }, { text: 'Total' }],
              },
            },
            legend: {
              display: true,
              position: 'left', // Posição da legenda
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
        const fN = path.join(__dirname, '..', config.dir.images, config.dir.charts, `${fName}.png`);  
        const chartImage = await chart.toFile(fN);
        await client.sendImage(from, fN, `*${title}*`);
        if (config.showLog === true) console.log(`${title}`);
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
          const fN = path.join(__dirname, '..', config.dir.images, config.dir.charts, `${fName}.png`);  
          const chartImage01 = await chart01.toFile(fN);
          await client.sendImage(from, fN, `Taxa de Conversão de Clientes: ${num}%`);
          if (config.showLog === true) console.log(`Taxa de Conversão de Clientes: ${num}`);
        } catch (error) {
          console.error('Erro ao criar o gráfico:', error);
        }
      }
}

module.exports = Chart;
