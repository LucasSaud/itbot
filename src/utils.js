const os = require('os');
const fs = require('fs');
const util = require('util');
const path = require('path');
const config = require('../conf/config');
const { Sequelize, DataTypes, Op } = require('sequelize');
const QuickChart = require('quickchart-js');
const moment = require('moment-timezone');
const Chart = require('./chart.js');
const Database = require('./db');

let doNotHandleNumbers = config.doNotHandleNumbers;

const Graph = new Chart();

const formatUptime = (uptimeInSeconds) => {
  const uptimeInSecondsRounded = Math.round(uptimeInSeconds);
  const hours = Math.floor(uptimeInSecondsRounded / 3600);
  const minutes = Math.floor((uptimeInSecondsRounded % 3600) / 60);
  const seconds = uptimeInSecondsRounded % 60;
  return `${hours} horas, ${minutes} minutos e ${seconds} segundos`;
}

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const delDir = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    const files = fs.readdirSync(directoryPath);
    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      fs.unlinkSync(filePath);
    });
    fs.rmdirSync(directoryPath);
    if (config.showLog === true ) console.log(`[ AVISO ] Diretório ${directoryPath} e seu conteúdo foram removidos.`);
  }
  else {
    if (config.showLog === true ) console.log(`[ AVISO ] Diretório ${directoryPath} não existe.`);
  }
}

const cleanOldFiles = (folder, ageOfFile) => {
  const now = new Date().getTime(); // Get the current time in milliseconds

  fs.readdir(folder, (err, files) => {
    if (err) {
      console.error('Error reading the graphics folder:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(folder, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting file information for ${file}:`, err);
          return;
        }
        const timeDifference = now - stats.ctime.getTime();
        if (timeDifference > ageOfFile) {
          fs.unlink(filePath, (err) => {
            if (err) {
              if (config.showLog === true ) console.error(`Error deleting the file ${file}:`, err);
            } else {
              if (config.showLog === true ) console.log(`The file ${file} has been deleted as it was older than 1 hour.`);
            }
          });
        }
      });
    });
  });
}

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

const isMonday = () => {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay();
  return dayOfWeek === 1;
};
 
const isBlocked = (numero) => {
  if(doNotHandleNumbers.includes(numero)) {
    return true;
  } else {
    return false;
  }
}

// Função para enviar uma mensagem de imagem
const sendImageMessage = async (client, chatId, imageFile, caption, fullpath) => {
  let imageFilePath = null;
    if (fullpath === false) {
      imageFilePath = path.join(__dirname, '..', 'img', imageFile);
    } else {
      imageFilePath = imageFile;
    }
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
    let count = 0;
    daysAgo.setDate(currentDate.getDate() - config.numOfDaysOff);

    const inactiveClients = await DB.Contacts.findAll({
      attributes: [
        'whatsappNumber'
      ],
      where: {
        whatsappNumber: {
          [Sequelize.Op.not]: config.empresa.botNumber
        },
        lastOrderDate: {
          [Sequelize.Op.lt]: daysAgo
        },
        isInactive: false,
      },
      raw: true,
    });

    if (config.showLog === true) console.log(`Resultado da consulta: ${JSON.stringify(inactiveClients)}`);

    if (inactiveClients.length === 0) {
      m.reply('⚠️ Não há clientes inativos a mais de 30 dias.');
    } else {
      for (const { whatsappNumber } of inactiveClients) {
        if (typeof whatsappNumber === 'string' && whatsappNumber.match(/^\d+@s.whatsapp.net$/)) {
          // O número de telefone está no formato esperado, adicione @s.whatsapp.net se necessário
          const formattedNumber = whatsappNumber.endsWith('@s.whatsapp.net') ? whatsappNumber : `${whatsappNumber}@s.whatsapp.net`;
          count++;
          await client.sendMessage(formattedNumber, { text: config.empresa.msgClientesInativos });
      

          // Atualize o campo isInactive na tabela Contacts
          await DB.Contacts.update({ isInactive: true }, {
            where: {
              whatsappNumber: whatsappNumber,
            }
          });

          await DB.saveLogs(`[ INFO ] Mensagem enviada para ${whatsappNumber}`);
          m.reply(`✅ Mensagem enviada para ${whatsappNumber}.`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.error(`Número de telefone inválido: ${whatsappNumber}`);
        }
      }
      m.reply(`✅ Prontinho. ${count} mensagen(s) enviada(s) aos clientes inativos.`);
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

    // Se não houver contatos para enviar, retornar
    if (uniqueWhatsAppNumbers.length === 0) {
      if (config.showLog === true ) console.log('Não há contatos para enviar marketing.');
      await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Não há contatos para enviar marketing.` });
      return;
    }

    let numOfMsgsSent = 0;

    // Loop através dos contatos e enviar marketing
    for (const { phoneNumber } of uniqueWhatsAppNumbers) {
      numOfMsgsSent++;
      await client.sendMessage(phoneNumber, { text: config.msgMkt });
      await DB.saveLogs(`[ INFO ] Mensagem enviada para ${phoneNumber}.`);
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
    await DB.saveLogs('[ ERROR ] Ocorreu um erro ao enviar as mensagens', error);
  }
};

const sendDevInfo = async (client, sender, DB, msg) => {
  const devMSG = `AutoAtende v${config.botVersion}\n` +
                 `Cliente: ${config.empresa.nomeDaLoja}\n` +
                 `Informaçoes:\n\n` +
                 (config.sendServerStatusDevMsg === true) ? getServerStatus(client, sender, DB, true) : `Não disponivel.` +
                 `Mensagem de erro: ${msg}`;

  await client.sendMessage(config.devNumber, { text: devMSG });
}

// Função para coletar informações do servidor e retornar uma mensagem formatada
const getServerStatus = async (client, sender, DB, devInfo) => {
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

      if(devInfo === true) {
        return statusMessage;
      } else {
        await client.sendMessage(sender, { text: statusMessage });
      }  
  } catch (error) {
    console.error('Erro ao obter status do servidor:', error);
    // Tratar o erro aqui, se necessário
  }
};

// Função para verificar se a mensagem é um comando válido
const parseCmd = async (client, pushname, body, mek, DB, sender) => {

  const senderNumber = sender.replace('@s.whatsapp.net', '');
  let isCommand = false;
  let isInDoNotHandleNumbers = null;

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
      if (config.showLog === true ) console.log(`Comando válido: ${command}`);
      isCommand = true;
      
      switch (command) {
        case 'ajuda':
          await client.sendMessage(sender, { delete: mek.key });
          const ajudaMessage = `
        ℹ️ *Comando de Ajuda* ℹ️

        Você pode usar os seguintes comandos:
        - *!entrega*: Notifica que o pedido saiu para entrega.
        - *!retirada*: Notifica que o pedido está pronto para retirada.
        - *!bloqueia*: Adiciona o número à lista de exclusão.
        - *!desbloqueia*: Remove o número da lista de exclusão.
        - *!bot*: Notifica o uso do robô.
        - *!status*: Verifica o status do servidor.
        - *!stats*: Obtém estatísticas e relatórios.
        - *!oi*: Recebe uma saudação do bot.
        - *!bv*: Recebe mensagens de boas-vindas.
        - *!cardapio*: Mostra o cardápio.
        - *!endereco*: Mostra o endereço da loja.
        - *!backup*: Realiza um backup do banco de dados.
        - *!ajuda*: Mostra esta mensagem de ajuda.

        Espero que isso tenha ajudado! 😊
          `;
          await client.sendMessage(sender, { text: ajudaMessage });
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} solicitou ajuda.`});
          break;

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
          
          if (config.botNumber === "5516997980088@s.whatsapp.net" && Utils.isMonday() === 1) {
            await client.sendMessage(sender, { text: config.msgAvisoSegundas });
          } else {
            await client.sendMessage(sender, { text: config.empresa.pedidoProntoRetirada });
          }
          
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi avisado para vir buscar o pedido.`});
          if (!isBlocked(senderNumber)) doNotHandleNumbers.push(senderNumber);
          break;

        case 'bot':
          await client.sendMessage(sender, { delete: mek.key });
          await client.sendMessage(sender, { text: config.msgAvisoBot });
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi notificado do uso do robô.`});
          break;

        case 'backup':
          await client.sendMessage(sender, { delete: mek.key });
          if (config.showLog === true) console.log('Rotina de backup iniciada.');
          const backupFile = await DB.backup();
          if (backupFile != false) {
            await client.sendMessage(config.empresa.botNumber, { text: `✅ Backup do banco de dados salvo com sucesso.\nArquivo: ${backupFile}`});
          } else {
            await client.sendMessage(config.empresa.botNumber, { text: `⛔ Não foi possivél realizar o backup do banco de dados.`});
          }
          break;
          
        case 'bloqueia':
          if (!isBlocked(senderNumber)) {
            await client.sendMessage(sender, { delete: mek.key });
            doNotHandleNumbers.push(senderNumber);
            await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi inserido na lista de exclusão.`});
          }
          else {
            await client.sendMessage(sender, { delete: mek.key });
            await DB.saveLogs(`[ REGISTRO ] O número ${senderNumber} já está na lista de exclusão do atendimento`);
            await client.sendMessage(config.empresa.botNumber, { text: `📵 O número ${senderNumber} já está na lista de exclusão do atendimento.`});
          }
          break;

        case 'desbloqueia':
          await client.sendMessage(sender, { delete: mek.key });
          isInDoNotHandleNumbers =  doNotHandleNumbers.indexOf(senderNumber);
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
          if (config.enableStatus === true) {
            getServerStatus(client, sender, DB);
          } else {
            await client.sendMessage(config.empresa.botNumber, { text: `A função *status* está desabilidata.`});
          }
          break;

        case 'stats':
          await client.sendMessage(sender, { delete: mek.key });
          if (config.enableStats === true) {
            Graph.sql01(client, sender, DB);
            Graph.sql02(client, sender, DB);
            generateAnalyticsReport(client, sender, DB);
          } else {
            await client.sendMessage(config.empresa.botNumber, { text: `A função *stats* está desabilidata.`});
          }
          break;

        case 'oi':
          await client.sendMessage(sender, { delete: mek.key });
          await client.sendMessage(sender, { text: `👋 Olá, novamente! Parece que você está explorando nosso atendimento virtual. Se precisar de ajuda com nosso cardápio delicioso ou quiser fazer um pedido, é só me chamar! Estou aqui para tornar sua experiência na Ital'in House incrível. 😊🍝🥂\n\nSe você tiver qualquer dúvida, envie "8" e aguarde, ok?` });
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi notificado.`});
          break;

        case 'bv':
          await client.sendMessage(sender, { delete: mek.key });
          isInDoNotHandleNumbers =  doNotHandleNumbers.indexOf(senderNumber);
          if (isInDoNotHandleNumbers !== -1) {
            doNotHandleNumbers.splice(isInDoNotHandleNumbers, 1);
            await DB.saveLogs(`[ REGISTRO ] O número ${senderNumber} foi removido da lista de exclusão.`);
            await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} foi removido da lista de exclusão.`});
          }
          await client.sendMessage(sender, { text: msgBoasVindas });
          await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));
          await client.sendMessage(sender, { text: config.msgBV1 });
          await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));
          await client.sendMessage(sender, { text: msgEndCardapio });    
          await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));
          if (config.botNumber === "5516997980088@s.whatsapp.net" && Utils.isMonday() === 1) {
            await client.sendMessage(sender, { text: config.msgAvisoSegundas });
          }

          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} recebeu mensagem de boas vindas.`});
          break;

        case 'cardapio':
          await client.sendMessage(sender, { delete: mek.key });
          await sendImageMessage(client, sender, "cardapio.jpg", config.empresa.verCardapio01, false);
          await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} recebeu mensagem com o cardápio.`});
          break;

        case 'endereco':
          await client.sendMessage(sender, { delete: mek.key });
          await sendLocationMessage(client, sender, config.empresa.latitude, config.empresa.longitude, config.empresa.nomeDaLoja, config.empresa.enderecoDaLoja);
          await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));
          await client.sendMessage(config.empresa.botNumber, { text: `✅ Prontinho. O número ${senderNumber} recebeu mensagem com o endereço.`});
          await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));
          await client.sendMessage(sender, { text: config.empresa.nossaLocalizacao });
          break;          

        default:
          await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Comando náo reconhecido. Comandos aceitaveis são:\n!entrega\n!retirada\n!bloqueia\n!desbloqueia\n!oi\n!bv`});
        
      }
      return isCommand;
    } else {
      // Ação a ser executada se o comando não for válido
      if (config.showLog === true ) console.log(`Comando inválido: ${command}`);
      return isCommand;
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
  const matches = mensagem.match(regex);

  if (matches) {
    for (const match of matches) {
      // Retorna o endereço encontrado
      const enderecoEncontrado = match;

      if (config.showLog === true) console.log("Encontrei o endereço:", enderecoEncontrado);

      // Codificar o endereço para URL
      const enderecoCodificado = encodeURIComponent(enderecoEncontrado);

      // Construir a URL para a consulta do CEP
      const url = `http://viacep.com.br/ws/SP/Franca/${enderecoCodificado}/json`;

      try {
        // Enviar a solicitação HTTP
        const response = await axios.get(url);
        if (config.showLog === true) console.log("Status da resposta:", response.status);
        if (config.showLog === true) console.log("Texto do status:", response.statusText);

        if (response.data && response.data.cep) {
          // Se existem dados do CEP, você pode continuar com o processamento normalmente
          const cep = response.data.cep;
          if (config.showLog === true) console.log("CEP encontrado:", cep);

          // Envie uma mensagem de resposta informando sobre o CEP encontrado
          const cliente = sender.replace('@s.whatsapp.net', '');
          const msg01 = `⚠️ O número ${cliente} passou um endereço residencial ou comercial.\nCEP: ${cep}.\nOlhar a conversa.`;
          await client.sendMessage(config.empresa.botNumber, { text: msg01 });
          return true;
        } else {
          // Se não existem dados do CEP, significa que o CEP não foi encontrado
          if (config.showLog === true) console.log("Endereço não encontrado");
          // Envie uma mensagem informando que o endereço não foi encontrado
          await client.sendMessage(config.empresa.botNumber, { text: `❌ Desculpe, não encontrei o CEP para o endereço: ${enderecoEncontrado}` });
        }
      } catch (error) {
        console.error('Erro durante o processo de atualização:', error.message);
        await client.sendMessage(config.empresa.botNumber, { text: `❌ Desculpe, ocorreu um erro ao buscar o CEP para o endereço: ${enderecoEncontrado}` });
      }
    }
  }

  // Se nenhum endereço foi encontrado na mensagem
  return false;
}

// Função para gerar gráfico de pizza com chartjs-node-canvas
const generatePieChart = async (client, sender, labels, data, title) => {

  let chart = new QuickChart();
  chart.setWidth(500)
  chart.setHeight(300);
  chart.setVersion('2.9.4');
  
  chart.setConfig({
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{ data: data }],
    },
    options: {
      backgroundColor: 'white',
      backgroundColour: 'white',
      legend: {
        position: 'left',
      },
      title: {
        display: true,
        text: `${title}`,
      },
    },
    plugins: {
      datalabels: {
        anchor: 'center',
        align: 'center',
        color: '#fff',
        font: {
          weight: 'bold',
        },
      }
    },
  });
  
  try {
      let fName = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
      const fN = path.join(__dirname, '..', 'img', config.chartDir, `${fName}.png`);  
      const chartImage = await chart.toFile(fN);
      await client.sendImage(sender, fN, `Sem titulo`);
  } catch (error) {
      console.error('Erro ao gerar gráfico de pizza:', error);
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

    // Verifique se há dados suficientes para gerar o gráfico de barras
    if (labels.length > 0) {
      // Agora, chame a função para gerar o gráfico de barras
      await generatePieChartWithCheck(labels, data, title);
    } else {
      await client.sendMessage(config.empresa.botNumber, { text: `⚠️ Não há dados suficientes para gerar o gráfico de atendimentos por dia.`});
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
      await generatePieChartWithCheck(months, counts, title4);
    } else {
      console.error('Nenhum dado retornado pela consulta de atendimentos mensais.');
    }
  } catch (error) {
    console.error('Erro ao gerar relatório de análise:', error);
  }
};

module.exports = {
  doNotHandleNumbers,
  isOpen,
  isBlocked,
  isMonday,
  sendImageMessage,
  sendImageMkt,
  sendLocationMessage,
  sendInactiveMessage,
  sendMKT,
  sendDevInfo,
  getServerStatus,
  parseCmd,
  searchCEP,
  cleanOldFiles,
  delDir,
  generateAnalyticsReport,
  generatePieChart
};