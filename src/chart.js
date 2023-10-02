const fs = require('fs');
const path = require('path');
const QuickChart = require('quickchart-js');
const config = require('../conf/config.js');
const utils = require('./utils');
const Database = require('./db');

class Chart {
    constructor() {
      this.version = '0.0.2';  
      if(config.enableDB === true) this.DB = new Database(); 
    }

    async sql01() {
        if (config.enableDB === true) {
            // Consulta para calcular a taxa de conversão
            const orderCount = await this.DB.Message.count({
                where: {
                body: '5' // Mensagens com body igual a 5 representam pedidos
                }
            });
        
            // Consulta para contar o número de números de telefone únicos na tabela `contacts` que têm pedidos
            const uniqueNumbersWithOrdersCount = await this.DB.Contacts.count({
                where: {
                whatsappNumber: {
                    [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT sender FROM messages WHERE body = '5')`)
                }
                }
            });
            // Calcular a taxa de conversão
            const conversionRate = (uniqueNumbersWithOrdersCount / orderCount) * 100;
            this.cBarGraph(conversionRate.toFixed(2));
        } else {
            const conversionRate = '92';
            this,this.cBarGraph(conversionRate);
        }
    }
  
    async barGraph() {
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
          console.log('Gráfico gerados com sucesso: ' + fN);
        } catch (error) {
          console.error('Erro ao criar o gráfico:', error);
        }
    }

    async aBarGraph() {
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
            const fN01 = path.join(__dirname, '..', 'img', config.chartDir, `${fName}.png`);  
            const chartImage01 = await chart2.toFile(fN01); // Gera a imagem do gráfico
            console.log('Gráfico gerados com sucesso: ' + fN01);
        } catch (error) {
          console.error('Erro ao criar o gráfico:', error);
        }
    }

    async cBarGraph(num) {
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
            const fN01 = path.join(__dirname, '..', 'img', config.chartDir, `${fName}.png`);  
            const chartImage01 = await chart01.toFile(fN01); // Gera a imagem do gráfico
            console.log('Gráfico gerados com sucesso: ' + fN01);
        } catch (error) {
          console.error('Erro ao criar o gráfico:', error);
        }
    }
}

console.log('usage:');
const c = new Chart();
c.sql01(); // cria imagem da taxa de conversao de clientes
c.aBarGraph();
c.barGraph();