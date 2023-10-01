const fs = require('fs');
const util = require('util');
const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
const moment = require('moment-timezone');
const config = require('./config');
const Database = require('./src/db');
const Utils = require('./src/utils');

module.exports = core = async (client, m, chatUpdate, ignoreNumber) => {
  try {

    const DB = new Database();
    const cmdArray = config.cmdArray;
    const currentTime = moment.tz(config.timeZone);
    const timestamp = currentTime.format('YYYY-MM-DD HH:mm:ss');

    const messageTypeHandlers = {
      conversation: m => m.message?.conversation || '',
      imageMessage: m => m.message?.caption || '',
      videoMessage: m => m.message?.caption || '',
      extendedTextMessage: m => m.message?.extendedTextMessage?.text || '',
      buttonsResponseMessage: m => m.message?.buttonsResponseMessage?.selectedButtonId || '',
      listResponseMessage: m => m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || '',
      templateButtonReplyMessage: m => m.message?.templateButtonReplyMessage?.selectedId || '',
      messageContextInfo: m => m.message?.buttonsResponseMessage?.selectedButtonId || m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || m.text || '',
      productMessage: m => m.message?.productMessage?.caption || '',
      documentMessage: m => m.message?.documentMessage?.caption || '',
      audioMessage: () => '',
      videoNoteMessage: m => m.message?.videoNoteMessage?.caption || '',
    };
  
    const body = messageTypeHandlers[m.mtype] ? messageTypeHandlers[m.mtype](m) : '';
  
    if (m.isGroup) return;

    const budy = typeof m.text == 'string' ? m.text : '';
    const command = body.toLowerCase();
    let isCmd2 = false;
    let args = [];
    const pushname = m.pushName || 'Sem Nome';

    const msgBoasVindas = config.msgBV0.replace('{{pushname}}', pushname);
    const msgEndCardapio = config.msgBV2.replace('{{enderecoCardapio}}', config.empresa.enderecoCardapio);
    const msgReforcoCliente = config.msgReforcoCliente.replace('{{pushname}}', pushname);

    let argsLog = budy.length > 30 ? `${budy.substring(0, 30)}...` : budy;

    const from = m.chat;
    const reply = m.reply;
    const replyImage = m.replyImage;
    const sender = m.sender;
    const mek = chatUpdate.messages[0];
    const isIndividualChat = m.isGroup === false;
    const senderNumber = m.sender.replace('@s.whatsapp.net', '');
    const itsMe = senderNumber == config.empresa.botNumber.replace('@s.whatsapp.net', '') ? true : false;
    const itsAdm = senderNumber == config.botAdmin.replace('@s.whatsapp.net', '') ? true : false;

    const today = new Date();

    if (command.length === 1 && cmdArray.includes(command) && !m.isGroup) {
      isCmd2 = true;
      await DB.saveLogs(`[ REGISTRO ] ${pushname} usou o comando ${command} [ ${m.sender.replace('@s.whatsapp.net', '')} ]`);
    }

    if(ignoreNumber) {
      if (!Utils.isBlocked(senderNumber)) {
        Utils.doNotHandleNumbers.push(senderNumber);   
      } 
      return;
    }

    if(body.startsWith('!')) {
      return;
    }

    if (Utils.isBlocked(senderNumber)) {
      return;
    }
    else if (!m.isGroup && !Utils.isOpen() && Utils.isBlocked(senderNumber) && !itsAdm && !itsMe) {
      await client.sendMessage(config.empresa.botNumber, {
        text: `🗣️ O usuário ${pushname} (${sender.replace(
          '@s.whatsapp.net',
          ''
        )}) entrou em contato conosco enquanto estávamos fechados.`,
      });
      await m.reply(
        `🤩 Olá, ${pushname} 👋!\n ${config.msgLojaFechada}`
      );
      await m.reply(
        config.empresa.horariosFuncionamento
      );
    }
    else if (m.isGroup) {
      return;
    }
    else if (Utils.isOpen() || itsMe || itsAdm) {
      if (command.startsWith('9') && !command.includes(',') && (from === config.empresa.botNumber || from === config.botAdmin)) {
        if (itsMe || itsAdm) {
          const cleanedCommand = command.replace(/\s+/g, ' ');
          const args = cleanedCommand.trim().split(' ');

          let phoneNumber = args[1];
          if (phoneNumber && phoneNumber.length === 9) phoneNumber = `5516${phoneNumber}`;
          
          const modifiedPhoneNumber = phoneNumber + '@s.whatsapp.net';

          if (args.length === 2 && args[1].startsWith('1')) {
            await Utils.sendMKT(DB, client);
          }
          else if (args.length === 2 && args[1].startsWith('2')) {
            await Utils.sendInactiveMessage(client, m, DB); 
          }
          else if (args.length === 2 && args[1].startsWith('3')) {
            Utils.generateAnalyticsReport(client, sender, DB);
          }
          else if (args.length === 2 && args[1].startsWith('4')) {
            await Utils.getServerStatus(client, sender, DB);
          }
          else if (args.length === 3 && phoneNumber.startsWith('55')) {      
            const codOp = parseInt(args[2]);
            if (codOp === 1) {
              DB.updateContact(modifiedPhoneNumber, 0, 1); 
              await client.sendMessage(modifiedPhoneNumber, { text: config.empresa.pedidoProntoRetirada });
              await m.reply(`✅ Prontinho. O número ${phoneNumber} foi avisado para vir buscar o pedido.`);
              if (!Utils.isBlocked(phoneNumber)) {
                Utils.doNotHandleNumbers.push(phoneNumber);
              }
            } else if (codOp === 2) {
              DB.updateContact(modifiedPhoneNumber, 1, 0); 
              await client.sendMessage(modifiedPhoneNumber, { text: config.empresa.pedidoSaiuParaEntrega });
              await m.reply(`✅ Prontinho. O número ${phoneNumber} foi avisado que o pedido saiu para entrega.`);
              if (!Utils.isBlocked(phoneNumber)) {
                Utils.doNotHandleNumbers.push(phoneNumber);
              }
            } else if (codOp === 3) {
                await client.sendMessage(modifiedPhoneNumber, { text: config.msgAvisoBot });
                await m.reply(`✅ Prontinho. O número ${phoneNumber} foi notificado do uso do robô.`);
            } else if (codOp === 4) {
                const isInDoNotHandleNumbers =  Utils.doNotHandleNumbers.indexOf(phoneNumber);
                if (isInDoNotHandleNumbers !== -1) {
                  Utils.doNotHandleNumbers.splice(isInDoNotHandleNumbers, 1);
                  await DB.saveLogs(`[ REGISTRO ] O número ${phoneNumber} foi removido da lista de exclusão.`);
                  await m.reply(`✅ Prontinho. O número ${phoneNumber} foi removido da lista de exclusão.`);
                } else {
                  await m.reply(`⚠️ O número ${phoneNumber} não foi encontrado na lista de exclusão. Por favor verifique o número digitado e tente novamente.`);
                }
            } else if (codOp === 5) {
              await client.sendMessage(modifiedPhoneNumber, { text: msgReforcoCliente });
              await m.reply(`✅ Prontinho. O número ${phoneNumber} foi notificado.`);
            } else if (codOp === 6) {
              await client.sendMessage(modifiedPhoneNumber, { text: config.msgBV });
              await client.sendMessage(modifiedPhoneNumber, { text: config.msgBV1 });
              await new Promise(resolve => setTimeout(resolve, 2000));
              await client.sendMessage(modifiedPhoneNumber, { text: msgEndCardapio });              
              await m.reply(`✅ Prontinho. O número ${phoneNumber} recebeu mensagem de boas vindas.`);
            } else {
              await m.reply('⚠️ Por favor, forneça 1 para retirada no balcao. 2 para entrega. 3 para dica de uso do robô. 4 para o robô voltar a atender o número solicitado. 5 para enviar mensagens de marketing em grupos.');
            }         
         }
        } else {
          await m.reply('🚫 Esse comando só pode ser executado pelo número do bot e pelo número do botAdmin.');
        }
      } else {
        if (
          !m.isGroup &&
          Utils.isOpen() &&
          !command.startsWith('9') &&
          !itsMe
        ) {

          switch (command) {
            case '0':
              await Utils.getServerStatus(client, sender, DB);        
              break;

            case '1':
              await m.reply(
                config.empresa.horariosFuncionamento
              );
              break;

            case '2':
              try {
                await Utils.sendImageMessage(client, from, "cardapio.jpg", config.empresa.verCardapio);
              } catch (error) {
                await DB.saveLogs(`[ ERRO ] Erro ao enviar imagem do cardápio. Motivo: ${error}`);
              }
              break;

            case '3':
              await Utils.sendLocationMessage(client, from, config.empresa.latitude, config.empresa.longitude, config.empresa.nomeDaLoja, config.empresa.enderecoDaLoja);
              await new Promise(resolve => setTimeout(resolve, 2000));
              await m.reply(
                config.empresa.nossaLocalizacao
              );
              break;

            case '4':
              await m.reply(
                config.empresa.tempoParaEntregar
              );
              break;

            case '5':
              await m.reply(
                config.empresa.fazerPedido
              );
              break;

            case '6':
              await Utils.sendImageMessage(client, from, "pagamentos.jpeg", config.empresa.legendaPagamentos);
              await new Promise(resolve => setTimeout(resolve, 2000));
              await m.reply(
                config.empresa.opcoesPagamento
              );
              break;

            case '7':
              await m.reply(
                config.empresa.opcoesRetirada
              );
              break;

            case '8':
              if (Utils.isBlocked(senderNumber)) {
                await m.reply(config.msgAtendente);
              } else {
                Utils.doNotHandleNumbers.push(senderNumber);
                await m.reply(
                  config.msgAvisoAtendente
                );
              }
              break;

            default: {
              await m.reply(
                msgBoasVindas
              );

              await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));

              await m.reply(
                config.msgBV1
              );

              await new Promise(resolve => setTimeout(resolve, config.tempoEntreMensagens));

              await m.reply(
              msgEndCardapio
              );

              if(config.mostrarMsgEntregaReduzida) {
                await m.reply(
                  config.msgEntregaReduzida
                );
              } else if (config.mostrarRestSuper) {
                await Utils.sendImageMessage(client, from, "restsuper.jpeg", config.legendaRestSuper);
              }

              if (isCmd2 && budy.toLowerCase() != undefined) {
                if (m.chat.endsWith('broadcast')) return;
                if (m.isBaileys) return;
                if (!budy.toLowerCase()) return;
                if (argsLog || (isCmd2 && !m.isGroup)) {
                  await DB.saveLogs(`[ ERRO ] O comando ${command} não existe ou não está disponível.`);
                } else if (argsLog || (isCmd2 && m.isGroup)) {
                  await DB.saveLogs(`[ ERRO ] O comando ${command} não existe ou não está disponível.`);
                }
              }
            }
          }
        }
      }
    }

    if(body !== '' && isCmd2 && !Utils.isBlocked(senderNumber)) {
      await DB.Message.create({
        sender: m.sender,
        body: body,
        timestamp: timestamp
      });
    }
    } catch (err) {
      await m.reply(util.format(err));
    }
};