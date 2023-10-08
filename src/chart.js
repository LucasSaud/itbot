const fs = require('fs');
const util = require('util');
const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
const QuickChart = require('quickchart-js');
const config = require('../conf/config.js');
const utils = require('./utils');

class Chart {
    constructor () {
      this.version = '0.0.5';  
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
            return this.cBarGraph(client, from, conversionRate.toFixed(2));
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
          return this.cBarGraph(client, from, conversionRate.toFixed(2));
  }

  async createBarChart (client, from, data) {
    // Organize os dados da consulta em um formato adequado para o gráfico
    const labels = data.map((entry) => entry.month); // Meses
    const counts = data.map((entry) => entry.count); // Número de atendimentos
    
    // Crie um gráfico de barras
    const chart = new QuickChart();
  
    chart.setWidth(500);
    chart.setHeight(300);
    chart.setVersion('2');
  
    chart.setConfig({
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Atendimentos',
            data: counts,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: 'Mês',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Número de Atendimentos',
            },
          },
        },
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#fff',
            backgroundColor: 'rgba(34, 139, 34, 0.6)',
            borderColor: 'rgba(34, 139, 34, 1.0)',
            borderWidth: 1,
            borderRadius: 5,
            formatter: (value) => {
              return value + 'k';
            },
          },
        },
      },
    });
  
    try {
      const fName = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
      const fN = path.join(__dirname, '..', 'img', config.chartDir, `${fName}.png`);  
      const chartImage = await chart.toFile(fN);
      await client.sendImage(from, fN, `Atendimentos por mês`);
    } catch (error) {
      console.error('Erro ao criar o gráfico:', error);
    }
  }
  
  async barGraph () {
    let chart = new QuickChart();
    let fName = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    chart.setWidth(500);
    chart.setHeight(300);
    chart.setVersion('2');
        
    chart.setConfig({
      type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'Atendimentos',
              data: [50, 60, 70, 180],
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            datalabels: {
              anchor: 'end',
              align: 'top',
              color: '#fff',
              backgroundColor: 'rgba(34, 139, 34, 0.6)',
              borderColor: 'rgba(34, 139, 34, 1.0)',
              borderWidth: 1,
              borderRadius: 5,
              formatter: (value) => {
                return value + 'k';
              },
            },
          },
        },
      });

      try {
        const fN = path.join(__dirname, '..', 'img', config.chartDir, `${fName}.png`);  
        const chartImage = await chart.toFile(fN); // Gera a imagem do gráfico
        if (config.showLog === true) console.log('Gráfico gerados com sucesso: ' + fN);
        return fN;
      } catch (error) {
        console.error('Erro ao criar o gráfico:', error);
      }
  }

  async aBarGraph () {
    let chart2 = new QuickChart();
    let fName = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    chart2.setWidth(500);
    chart2.setHeight(300);
    chart2.setVersion('2');

    chart2.setConfig({
      "type": "horizontalBar",
      "data": {
          "labels": [
          "Janeiro",
          "Fevereiro",
          "Março",
          "Abril",
          "Maio",
          "Junho",
          "Julho"
        ],
      "datasets": [
            {
                "label": "Dataset 1",
                "backgroundColor": "rgba(255, 99, 132, 0.5)",
                "borderColor": "rgb(255, 99, 132)",
                "borderWidth": 1,
                "data": [
                -32,
                62,
                64,
                41,
                -31,
                -32,
                87
                ]
            },
            {
                "label": "Dataset 2",
                "backgroundColor": "rgba(54, 162, 235, 0.5)",
                "borderColor": "rgb(54, 162, 235)",
                "data": [
                9,
                -100,
                -13,
                64,
                -57,
                26,
                20
                ]
            }
            ]
        },
        "options": {
            "elements": {
            "rectangle": {
                "borderWidth": 2
            }
            },
            "responsive": true,
            "legend": {
            "position": "right"
            },
            "title": {
            "display": true,
            "text": "Chart.js Horizontal Bar Chart"
            }
        }
        });

        try {
            const fN = path.join(__dirname, '..', 'img', config.chartDir, `${fName}.png`);  
            const chartImage = await chart2.toFile(fN); // Gera a imagem do gráfico
            if (config.showLog === true) console.log('Gráfico gerados com sucesso: ' + fN);
            return fN;
        } catch (error) {
          console.error('Erro ao criar o gráfico:', error);
        }
    }

    async cBarGraph (client, from, num) {
        let chart01 = new QuickChart();

        let fName = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        chart01.setWidth(500);
        chart01.setHeight(150);
        chart01.setVersion('3');
        
        chart01.setConfig({
          type: 'bar',
          data: {
            labels: ['Q1'],
            datasets: [
              {
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
