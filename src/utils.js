const os = require('os');
const fs = require('fs');
const util = require('util');
const path = require('path');
const config = require('../config');
const { Sequelize, DataTypes, Op } = require('sequelize');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const moment = require('moment-timezone');

const graphicsFolder = path.join(__dirname, '..', 'img', 'charts');

let doNotHandleNumbers = config.doNotHandleNumbers;

const randomNum = () => {
    const min = 1000; // O menor número de 4 dígitos (1000)
    const max = 9999; // O maior número de 4 dígitos (9999)
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para formatar o tempo de atividade em horas, minutos e segundos
const formatUptime = (uptimeInSeconds) => {
  const uptimeInSecondsRounded = Math.round(uptimeInSeconds);
  const hours = Math.floor(uptimeInSecondsRounded / 3600);
  const minutes = Math.floor((uptimeInSecondsRounded % 3600) / 60);pm2
  const seconds = uptimeInSecondsRounded % 60;
  return `${hours} horas, ${minutes} minutos e ${seconds} segundos`;
}

// Função para formatar bytes em uma representação legível
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Function to delete directory and all it content
const delDir = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    const files = fs.readdirSync(directoryPath);
    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      fs.unlinkSync(filePath);
    });
    fs.rmdirSync(directoryPath);
    console.log(`[ AVISO ] Diretório ${directoryPath} e seu conteúdo foram removidos.`);
  }
  else {
    console.log(`[ AVISO ] Diretório ${directoryPath} não existe.`);
  }
}

// Function to check and delete files older than 1 hour
const cleanOldFiles = () => {
  const now = new Date().getTime(); // Get the current time in milliseconds

  fs.readdir(graphicsFolder, (err, files) => {
    if (err) {
      console.error('Error reading the graphics folder:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(graphicsFolder, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting file information for ${file}:`, err);
          return;
        }

        // Calculate the time difference between the current time and the file's creation time
        const timeDifference = now - stats.ctime.getTime();

        // If the file is older than 1 hour, delete it
        if (timeDifference > 3600000) { // 3600000 milliseconds = 1 hour
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting the file ${file}:`, err);
            } else {
              console.log(`The file ${file} has been deleted as it was older than 1 hour.`);
            }
          });
        }
      });
    });
  });
}

// Verificação de horário de funcionamento
const isOpen = () => {
  const d = new Date();
  const hora = d.getHours();
  const hoje = config.diasSemana[d.getDay()];
  
  if ((hoje === 'Domingo' || hoje === 'Sábado') && hora >= 8 && hora < 23) {
    return true;
  }
  else if ((hora >= 8 && hora < 18) || (hora >= 18 && hora < 23)) {
    return true;
  }
  else {
    return false;
  }
}
 
const isBlocked = (numero) => {
  if(doNotHandleNumbers.includes(numero)) {
    return true;
  } else {
    return false;
  }
}

// Função para enviar uma mensagem de imagem
const sendImageMessage = async (client, chatId, imageFile, caption) => {
    const imageFilePath = path.join(__dirname, '..', 'img', imageFile);
    const imageBuffer = await util.promisify(fs.readFile)(imageFilePath);
    await client.sendImage(chatId, imageBuffer, caption);
};

// Função para enviar uma imagem de marketing
const sendImageMkt = async (client, chatId, caption) => {
    const imageFilePath = path.join(__dirname, '..', 'img', 'mkt01.jpg');
    const imageBuffer = await util.promisify(fs.readFile)(imageFilePath);
    await client.sendImage(chatId, imageBuffer, caption);
};

// Função para enviar uma mensagem de localização
const sendLocationMessage = async (client, chatId, latitude, longitude, caption) => {
    const location = {
        degreesLatitude: latitude,
        degreesLongitude: longitude,
        name: caption,
      };
      await client.sendMessage(chatId, { location });
};



const sendInactiveMessage = async (client, m, DB) => {
    try {
        const currentDate = new Date();
        const daysAgo = new Date();
        daysAgo.setDate(currentDate.getDate() - config.numOfDaysOff);
    
        const inactiveClients = await DB.Message.findAll({
          attributes: [
            [DB.sequelize.fn('DISTINCT', DB.sequelize.col('sender')), 'phoneNumber']
          ],
          where: {
            sender: {
              [Sequelize.Op.ne]: config.empresa.botNumber
            },
            timestamp: {
              [Sequelize.Op.lt]: daysAgo
            },
            isInactive: false,
          },
          raw: true,
        });
          
        if (inactiveClients.length === 0) {
          m.reply('⚠️ Não há clientes inativos a mais de 30 dias.');
        } else {
          for (const { phoneNumber } of inactiveClients) {
            await client.sendMessage(phoneNumber, { text: config.msgClientesInativos });
            await DB.saveLogs(`Mensagem enviada para ${phoneNumber}`);
            m.reply('✅ Mensagem enviada para ${phoneNumber}.');
            await DB.Message.update({ isInactive: true }, {
              where: {
                sender: phoneNumber,
              }
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          m.reply(`✅ Prontinho. Mensagem enviada aos clientes inativos.`);
        }    
      } catch (error) {
        m.reply('⚠️ Ocorreu um erro ao enviar as mensagens:', error);
      }
};

const sendMKT = async (DB, client) => {
  try {
    // Consultar contatos únicos que não receberam marketing
    const uniqueWhatsAppNumbers = await DB.Contacts.findAll({
      attributes: [
        [DB.sequelize.fn('DISTINCT', DB.sequelize.col('whatsappNumber')), 'phoneNumber']
      ],
      where: {
        whatsappNumber: {
          [Sequelize.Op.ne]: config.empresa.botNumber
        },
        isMktSent: 0,
      },
      limit: config.numMaxMsgMkt,
      raw: true,
    });
    console.log(`Resultados da consulta: ${uniqueWhatsAppNumbers}`);

    // Se não houver contatos para enviar, retornar
    if (uniqueWhatsAppNumbers.length === 0) {
      console.log('Não há contatos para enviar marketing.');
      await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Não há contatos para enviar marketing.` });
      return;
    }

    let numOfMsgsSent = 0;

    // Loop através dos contatos e enviar marketing
    for (const { phoneNumber } of uniqueWhatsAppNumbers) {
      numOfMsgsSent++;
      await client.sendMessage(phoneNumber, { text: config.msgMkt });
      await DB.saveLogs(`Mensagem enviada para ${phoneNumber}.`);
      await client.sendMessage(config.empresa.botNumber, { text: `✅ Mensagem enviada para ${phoneNumber}.` });
      await DB.Contacts.update({ isMktSent: true }, {
        where: {
          whatsappNumber: phoneNumber,
        }
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. ${numOfMsgsSent} mensagens enviadas.` });

  } catch (error) {
    await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Ocorreu um erro ao enviar as mensagens ${error}.` });
    await DB.saveLogs('Error: Ocorreu um erro ao enviar as mensagens', error);
  }
};

// Função para coletar informações do servidor e retornar uma mensagem formatada
const getServerStatus = async (client, sender, DB) => {
  try {

    // Tempo de atividade do sistema operacional em segundos
    const osUpTime = await formatUptime(os.uptime());

    // Nome do processador
    const processorName = os.cpus()[0].model;

    // Arquitetura do processador (e.g., x64)
    const processorArchitecture = os.arch();

    // Número de núcleos do processador
    const numCores = os.cpus().length;

    // Informações de memória
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const totalMemoryF = formatBytes(totalMemory);
    const freeMemoryF = formatBytes(freeMemory);
    const usedMemoryF = formatBytes(usedMemory);

    // Consulta SQL para o tamanho do banco de dados
    const databaseResults = await DB.sequelize.query('SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb FROM information_schema.tables', {
      type: Sequelize.QueryTypes.SELECT
    });
    const databaseSizeMB = databaseResults[0].size_mb;

    // Informações do AutoAtende
    const lsbotInfo = `🤖 _Versão do AutoAtende:_ ${config.botVersion}`;

    // Informações do sistema operacional
    let osInfo;

    const platform = os.platform();

    switch (platform) {
      case 'aix':
          osInfo = `🖥️ _Sistema Operacional:_ IBM AIX`;
          break;
      case 'android':
          osInfo = `🖥️ _Sistema Operacional:_ Android`;
          break;
      case 'darwin':
          osInfo = `🖥️ _Sistema Operacional:_ OSX`;
          break;
      case 'freebsd':
          osInfo = `🖥️ _Sistema Operacional:_ FreeBSD`;
          break;
      case 'linux':
          osInfo = `🖥️ _Sistema Operacional:_ Linux`;
          break;
      case 'openbsd':
          osInfo = `🖥️ _Sistema Operacional:_ OpenBSD`;
          break;
      case 'sunos':
          osInfo = `🖥️ _Sistema Operacional:_ SunOS`;
          break;
      case 'win32':
          osInfo = `🖥️ _Sistema Operacional:_ Windows`;
          break;
      default:
          osInfo = `🖥️ _Sistema Operacional:_ Desconhecido`;
    }

    // Consulta SQL para a versão do MariaDB
    const mariadbResults = await DB.sequelize.query('SELECT VERSION() AS version', {
      type: Sequelize.QueryTypes.SELECT
    });
    const mariadbVersion = `🐬 _Versão do MariaDB:_ ${mariadbResults[0].version}`;

    // Versão do Node.js
    const nodejsVersion = `🚀 _Node.js:_ ${process.version}`;

    // Montar a mensagem de status
    const statusMessage = `*AutoAtende - Status do Servidor*\n\n` +
      `⌛ Tempo de Atividade do S.O: ${osUpTime}\n\n` +
      `🖥️ _Processador:_ ${processorName}\n` +
      `⚙️ _Arquitetura do Processador:_ ${processorArchitecture}\n` +
      `🔥 _Número de Núcleos do Processador:_ ${numCores}\n` +
      `💾 _Memória Total:_ ${totalMemoryF}\n` +
      `📊 _Memória Livre:_ ${freeMemoryF}\n` +
      `💽 _Memória Usada:_ ${usedMemoryF}\n` +
      `🗄️ _Tamanho do Banco de Dados:_ ${databaseSizeMB} MB\n` +
      `${osInfo}\n` +
      `${mariadbVersion}\n` +
      `${nodejsVersion}\n` +
      `${lsbotInfo}`;

    // Enviar a mensagem ao cliente
    await client.sendMessage(sender, { text: statusMessage });
  } catch (error) {
    console.error('Erro ao obter status do servidor:', error);
    // Tratar o erro aqui, se necessário
  }
};

// Função para verificar se a mensagem é um comando válido
const verificarComando = async (client, pushname, body, mek, DB, sender) => {

  const senderNumber = sender.replace('@s.whatsapp.net', '');

  const msgBoasVindas = config.msgBV;
  const msgEndCardapio = config.msgBV2.replace('{{enderecoCardapio}}', config.empresa.enderecoCardapio);
  const msgReforcoCliente = config.msgReforcoCliente.replace('{{pushname}}', pushname);

  // Verifica se a mensagem começa com !
  if (body.startsWith('!')) {
    // Obtém a palavra após "!" removendo o "!"
    const command = body.slice(1).toLowerCase(); // Converte para minúsculas para evitar problemas de maiúsculas/minúsculas

    // Verifica se o comando está na lista de comandos permitidos
    if (config.atalhos.includes(command)) {
      // Ação a ser executada se o comando for válido
      console.log(`Comando válido: ${command}`);
      
      switch (command) {
        case 'entrega':
          await client.sendMessage(sender, { delete: mek.key });
          DB.updateContact(sender, 1, 0);         
          await client.sendMessage(sender, { text: config.empresa.pedidoSaiuParaEntrega });
          await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi avisado que o pedido saiu para entrega.`});
          if (!isBlocked(senderNumber)) doNotHandleNumbers.push(senderNumber);
          break;

        case 'retirada':
          await client.sendMessage(sender, { delete: mek.key });
          DB.updateContact(senderNumber, 0, 1); 
          await client.sendMessage(sender, { text: config.empresa.pedidoProntoRetirada });
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi avisado para vir buscar o pedido.`});
          if (!isBlocked(senderNumber)) doNotHandleNumbers.push(senderNumber);
          break;

        case 'bot':
          await client.sendMessage(sender, { delete: mek.key });
          await client.sendMessage(sender, { text: config.msgAvisoBot });
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi notificado do uso do robô.`});
          break;

        case 'bloqueia':
          if (!isBlocked(senderNumber)) {
            await client.sendMessage(sender, { delete: mek.key });
            doNotHandleNumbers.push(senderNumber);
            await DB.saveLogs(`[ REGISTRO ] O número ${senderNumber} foi adicionado à lista de exclusão do atendimento.`);
            await client.sendMessage(config.empresa.botNumber, { text: `📵 O número ${senderNumber} foi adicionado à lista de exclusão do atendimento.`});

          }
          else {
            await client.sendMessage(sender, { delete: mek.key });
            await DB.saveLogs(`[ REGISTRO ] O número ${senderNumber} já está na lista de exclusão do atendimento`);
            await client.sendMessage(config.empresa.botNumber, { text: `📵 O número ${senderNumber} já está na lista de exclusão do atendimento.`});
          }
          break;

        case 'desbloqueia':
          await client.sendMessage(sender, { delete: mek.key });
          const isInDoNotHandleNumbers =  doNotHandleNumbers.indexOf(senderNumber);
          if (isInDoNotHandleNumbers !== -1) {
            doNotHandleNumbers.splice(isInDoNotHandleNumbers, 1);
            await DB.saveLogs(`[ REGISTRO ] O número ${senderNumber} foi removido da lista de exclusão.`);
            await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi removido da lista de exclusão.`});
          } else {
            await client.sendMessage(config.empresa.botNumber, { text: `⚠️ O número ${senderNumber} não foi encontrado na lista de exclusão. Por favor verifique o número digitado e tente novamente.`});
          }
          break;

        case 'status':
          await client.sendMessage(sender, { delete: mek.key });
          getServerStatus(client, sender, DB);
          break;

        case 'stats':
          await client.sendMessage(sender, { delete: mek.key });          
          generateAnalyticsReport(client, sender, DB);
          break;

        case 'oi':
          await client.sendMessage(sender, { delete: mek.key });
          await client.sendMessage(sender, { text: `👋 Olá, novamente! Parece que você está explorando nosso atendimento virtual. Se precisar de ajuda com nosso cardápio delicioso ou quiser fazer um pedido, é só me chamar! Estou aqui para tornar sua experiência na Ital'in House incrível. 😊🍝🥂\n\nSe você tiver qualquer dúvida, envie "8" e aguarde, ok?` });
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi notificado.`});
          break;

        case 'bv':
          await client.sendMessage(sender, { delete: mek.key });
          await client.sendMessage(sender, { text: msgBoasVindas });
          await client.sendMessage(sender, { text: config.msgBV1 });
          await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));
          await client.sendMessage(sender, { text: msgEndCardapio });              
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} recebeu mensagem de boas vindas.`});
          break;

        case 'cardapio':
          await client.sendMessage(sender, { delete: mek.key });
          await sendImageMessage(client, sender, "cardapio.jpg", config.empresa.verCardapio01);
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} recebeu mensagem com o cardápio.`});
          break;

        default:
          await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Comando náo reconhecido. Comandos aceitaveis são:\n!entrega\n!retirada\n!bloqueia\n!desbloqueia\n!oi\n!bv`});
        
      }
    } else {
      // Ação a ser executada se o comando não for válido
      console.log(`Comando inválido: ${command}`);
    }
  }
};

const searchCEP = async (axios, client, mensagem, sender) => {
  // Converter a mensagem para letras minúsculas para evitar problemas de capitalização
  mensagem = mensagem.toLowerCase();

  // Construir um padrão de expressão regular com os tipos de logradouro válidos
  const padrao = `\\b(${config.tiposDeLogradouros.join('|')})\\s+([a-zA-Z\\s]+)\\b`;

  // Usar a expressão regular para encontrar o endereço na mensagem
  const regex = new RegExp(padrao);
  const match = mensagem.match(regex);

  if (match) {
    // Retorna o endereço encontrado sem o logradouro
    const enderecoEncontrado = match[2];

    // Codificar o endereço para URL
    const enderecoCodificado = encodeURIComponent(enderecoEncontrado);

    // Construir a URL para a consulta do CEP
    const url = `http://viacep.com.br/ws/SP/Franca/${enderecoCodificado}/json`;

    try {
      // Enviar a solicitação HTTP
      const response = await axios.get(url);
      console.log("Status da resposta:", response.status);
      console.log("Texto do status:", response.statusText);

      if (response.data && response.data[0].cep) {
        // Se existem dados do CEP, você pode continuar com o processamento normalmente
        const cep = response.data[0].cep;
        console.log("CEP encontrado:", cep);

        // Envie uma mensagem de resposta informando sobre o CEP encontrado
        const cliente = sender.replace('@s.whatsapp.net', '');
        const msg01 = `⚠️ O número ${cliente} passou um endereço residencial ou comercial.\nCEP: ${cep}.\nOlhar a conversa.`;
        await client.sendMessage(config.empresa.botNumber, { text: msg01 });
        return true;
      } else {
        // Se não existem dados do CEP, significa que o CEP não foi encontrado
        console.log("Endereço não encontrado");
        // Envie uma mensagem informando que o endereço não foi encontrado
        await client.sendMessage(config.empresa.botNumber, { text: `❌ Desculpe, não encontrei o CEP para o endereço: ${enderecoEncontrado}` });
        return false;
      }
    } catch (error) {
      await client.sendMessage(config.empresa.botNumber, { text: `❌ Desculpe, não encontrei o CEP para o endereço: ${enderecoEncontrado}` });
      return false;
    }
  } else {
    return false;
  }
}

// Função para gerar gráfico de pizza com chartjs-node-canvas
const generatePieChart = async (client, sender, labels, data, title) => {
  const canvasWidth = 800;
  const canvasHeight = 600;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: canvasWidth, height: canvasHeight, backgroundColour: 'white' });

  const configuration = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
      },
      layout: {
        padding: {
          top: 20,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 18,
            family: 'Arial',
          },
        },
      },
    },
  };

  try {
    const chartBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    const graphFilePath = path.join(__dirname, '..', 'img', 'charts', `piechart.png`);
    fs.writeFileSync(graphFilePath, chartBuffer);

    const graphBuffer = await util.promisify(fs.readFile)(graphFilePath);
    await client.sendImage(sender, graphBuffer, title);
  } catch (error) {
    console.error('Erro ao gerar gráfico de pizza:', error);
  }
};

// Função para gerar gráfico de barras com chartjs-node-canvas
const generateBarChart = async (client, sender, labels, data, title, barColors) => {
  const canvasWidth = 800;
  const canvasHeight = 600;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: canvasWidth, height: canvasHeight, backgroundColour: 'white' });

  const configuration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: barColors,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
      },
      layout: {
        padding: {
          top: 20,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 18,
            family: 'Arial',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  try {
    const chartBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    const graphFilePath = path.join(__dirname, '..', 'img', 'charts', `barcharts_${randomNum()}.png`);
    fs.writeFileSync(graphFilePath, chartBuffer);

    const graphBuffer = await util.promisify(fs.readFile)(graphFilePath);
    await client.sendImage(sender, graphBuffer, title);
  } catch (error) {
    console.error('Erro ao gerar gráfico de barras:', error);
  }
};


async function generateAnalyticsReport(client, sender, DB) {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Função para obter dados de acesso
    async function getAccessData() {
      return await DB.Message.findAll({
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
    }

    // Função para gerar gráfico de barras
    async function generateBarChartWithCheck(labels, data, title, barColors, type) {
      if(type) {
        if (data.length < 7) {
          await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Não há dados suficientes para gerar o gráfico de atendimentos por dia.`});
        } else {
          await generateBarChart(client, sender, labels, data, title, barColors);
        }
      } else {
          await generateBarChart(client, sender, labels, data, title, barColors);
      }
    }

    // Função para gerar gráfico de pizza
    async function generatePieChartWithCheck(labels, data, title) {
      if (data.length === 0) {
        await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Não há dados suficientes para gerar o gráfico.`});
      } else {
        await generatePieChart(client, sender, labels, data, title);
      }
    }

    // Obter dados de acesso
    const accessData = await getAccessData();

    // Gerar gráfico de atendimentos por dia
    const labels = accessData.map(entry => {
      const date = new Date(entry.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const data = accessData.map(entry => entry.count);
    const title = 'Atendimentos por Dia - AutoAtende';
    const barColors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
    await generateBarChartWithCheck(labels, data, title, barColors, true);

    today.setHours(0, 0, 0, 0);

    // Obter dados de atendimentos por hora
    const frequentTimes = await DB.Message.findAll({
      attributes: [
        [Sequelize.fn('HOUR', Sequelize.col('timestamp')), 'hour'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('sender'))), 'count']
      ],
      where: {
        timestamp: {
          [Op.gte]: today,
          [Op.lt]: new Date(today.getTime() + 12 * 60 * 60 * 1000), // Buscar um período de 12 horas
        },
      },
      group: [
        Sequelize.fn('HOUR', Sequelize.col('timestamp'))
      ],
      order: [
        [Sequelize.fn('HOUR', Sequelize.col('timestamp')), 'ASC']
      ],
      raw: true
    });

    // Verifique se passaram mais de 4 horas desde o início do turno
    const currentTime = new Date();
    const timeDifferenceInHours = (currentTime - today) / (1000 * 60 * 60);

    if (timeDifferenceInHours > 4) {
      // Gerar gráfico de atendimentos por hora
      const labels1 = Array.from({ length: 12 }, (_, i) => `${i}:00`); // Gerar rótulos de 0:00 a 11:00
      const data1 = Array.from({ length: 12 }, () => 0); // Inicializar dados para cada hora como 0

      frequentTimes.forEach((timeData) => {
        // Preencher os dados com a contagem correspondente para cada hora
        const hour = timeData.hour;
        data1[hour] = timeData.count;
      });

      const title1 = 'Atendimentos por Hora - AutoAtende';
      const barColors1 = ['rgba(75, 192, 192, 0.8)', 'rgba(192, 75, 192, 0.8)', 'rgba(192, 192, 75, 0.8)'];
      await generateBarChart(client, sender, labels1, data1, title1, barColors1);
    } else {
      await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Não passaram mais de quatro horas desde o início do turno. Aguarde um pouco para gerar o gráfico.`});
    }

    // Obter dados de utilização de comandos
    const messageCounts = await DB.Message.findAll({
      attributes: [
        'body',
        [DB.sequelize.fn('COUNT', DB.sequelize.col('body')), 'quantidade'],
      ],
      where: {
        body: {
          [Op.regexp]: '^[1-8]$',
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
    const labels2 = [];
    const data2 = [];
    messageCounts.forEach(result => {
      labels2.push(commandMapping[result.body]);
      data2.push(result.quantidade);
    });
    const title2 = 'Utilização dos Comandos - AutoAtende';
    await generatePieChartWithCheck(labels2, data2, title2);

    // Obter dados de tempos médios de resposta
    const responseTimes = await DB.ResponseTimes.findAll({
      attributes: [
        'sender',
        [DB.sequelize.fn('AVG', DB.sequelize.col('responseTime')), 'avgResponseTime'],
      ],
      group: ['sender'],
      raw: true,
    });

    if (responseTimes.length > 0) {
      // Ordenar os registros com base no tempo médio em ordem decrescente
      responseTimes.sort((a, b) => parseFloat(b.avgResponseTime) - parseFloat(a.avgResponseTime));

      // Pegar os 5 tempos mais lentos
      const topResponseTimes = responseTimes.slice(0, 5);

      // Criar os dados para o gráfico
      const data3 = {};
      const labels3 = [];
      topResponseTimes.forEach((item, index) => {
        // Use um rótulo genérico para a coluna
        data3[`Coluna ${index + 1}`] = parseFloat(item.avgResponseTime);
        // Crie uma legenda associando números de celular a números de coluna
        labels3.push(`Celular ${index + 1}`);
      });

      const avgResponseTimes = Object.values(data3);
      const title3 = 'Top 5 Tempos Médios de Resposta por Remetente - AutoAtende';
      await generateBarChart(client, sender, labels3, avgResponseTimes, title3, barColors);
    } else {
      console.error('Nenhum dado retornado pela consulta de tempos de resposta.');
    }

    // Consulta para obter a contagem de atendimentos por mês, considerando contatos únicos
    const monthlyCounts = await DB.Message.findAll({
      attributes: [
        [DB.sequelize.fn('DATE_FORMAT', DB.sequelize.col('timestamp'), '%Y-%m'), 'month'],
        [DB.sequelize.fn('COUNT', DB.sequelize.fn('DISTINCT', DB.sequelize.col('sender'))), 'count']
      ],
      group: [DB.sequelize.fn('DATE_FORMAT', DB.sequelize.col('timestamp'), '%Y-%m')],
      raw: true,
    });

    if (monthlyCounts.length > 0) {
      // Mapear os resultados para extrair os dados necessários
      const months = []; // Para armazenar os meses em português
      const counts = []; // Para armazenar a contagem de atendimentos

      // Mapear os resultados e converter o formato da data para o mês em português
      monthlyCounts.forEach((item) => {
        const dateParts = item.month.split('-');
        const monthNumber = parseInt(dateParts[1]);
        const monthName = moment().locale('pt-BR').month(monthNumber - 1).format('MMMM'); // Converter o número do mês para o nome do mês em português
        const formattedMonth = `${monthName}`;

        months.push(formattedMonth);
        counts.push(item.count);
      });

      const title4 = 'Atendimentos por Mês - AutoAtende';
      await generateBarChartWithCheck(months, counts, title4, barColors, false);
    } else {
      console.error('Nenhum dado retornado pela consulta de atendimentos mensais.');
    }

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
          [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT sender FROM messages WHERE body = '5')`) // Subconsulta para obter os números únicos que fizeram pedidos
        }
      }
    });

    // Calcular a taxa de conversão
    const conversionRate = (uniqueNumbersWithOrdersCount / orderCount) * 100;

    // Arredondar a taxa de conversão para duas casas decimais
    const roundedConversionRate = conversionRate.toFixed(2);

    // Criar um gráfico de pizza para mostrar a taxa de conversão
    const title5 = `Taxa de Conversão de Pedidos: ${roundedConversionRate}% - AutoAtende`;
    const labels4 = ['Menu 5: Fazer Pedido', 'Pedidos Feitos'];
    const data4 = [orderCount, uniqueNumbersWithOrdersCount];
    const pieColors2 = ['#3498db', '#27ae60']; // Cores para os setores do gráfico de pizza
    await generatePieChartWithCheck(labels4, data4, title5, pieColors2);
  } catch (error) {
    console.error('Erro ao gerar relatório de análise:', error);
  }
}

module.exports = {
  doNotHandleNumbers,
  isOpen,
  isBlocked,
  sendImageMessage,
  sendImageMkt,
  sendLocationMessage,
  generatePieChart,
  generateBarChart,
  sendInactiveMessage,
  sendMKT,
  getServerStatus,
  verificarComando,
  generateAnalyticsReport,
  searchCEP,
  cleanOldFiles,
  delDir,
};