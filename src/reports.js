const fs = require('fs');
const util = require('util');
const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
const moment = require('moment-timezone');
const config = require('./conf/config');
const Database = require('./src/db');
const Utils = require('./src/utils');
const Chart = require('./src/chart');

// Importe as bibliotecas necessárias
const PDFDocument = require('pdfkit');
const { Sequelize, DataTypes } = require('sequelize');
const QuickChart = require('quickchart-js');

// Importe o módulo de configuração do banco de dados (db.js)
const Database = require('./db');

// Função para gerar o relatório em PDF
async function generateLeadScoreReport() {
    // Crie um novo documento PDF
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream('lead_score_report.pdf'));
  
    // Título do relatório
    doc.fontSize(18).text('Relatório de Pontuação de Leads (Top 5 no Gráfico)', { align: 'center' });
    doc.moveDown();
  
    try {
      const leadScoresData = await db.Contacts.findAll({
        attributes: ['whatsappNumber', 'points'],
        order: [['points', 'DESC']],
        limit: 30, // Limita a consulta aos 30 melhores resultados
      });
        
      // Formate os dados para o gráfico (limitando a 5 para o gráfico)
      const chartData = leadScoresData.slice(0, 5).map((lead) => ({
        name: lead.whatsappNumber,
        count: lead.points,
      }));
        
      // Gere o gráfico de pontuação de leads usando a função do módulo Chart
      const fN = await Chart.dGraph(client, from, chartData, 'Pontuação dos 5 Melhores Leads');
        
      // Adicione a imagem do gráfico ao PDF
      doc.image(fN, 100, doc.y, { width: 400 });
  
      // Lista de pontuações dos 30 melhores leads no relatório escrito
      doc.moveDown();
      doc.fontSize(14).text('Pontuações dos 30 Melhores Leads (Top 5 no Gráfico):', { underline: true });
  
      leadScores.forEach((lead) => {
        doc.fontSize(12).text(`${lead.whatsappNumber}: ${lead.points}`);
      });
  
      // Finalize o PDF
      doc.end();
  
      console.log('Relatório de pontuação dos 30 melhores leads gerado com sucesso.');
    } catch (error) {
      console.error('Erro ao gerar o relatório:', error);
    }
  }
  
  // Chame a função para gerar o relatório
  generateLeadScoreReport();
  