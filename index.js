// Import necessary libraries and modules
const baileys = require('@whiskeysockets/baileys'); // Baileys library for WhatsApp interactions
const pino = require('pino'); // Logging library
const { Boom } = require('@hapi/boom'); // Boom library from hapi
const fs = require('fs'); // Node.js filesystem module
const path = require('path'); // Node.js path module
const axios = require('axios'); // Axios HTTP client
const NodeCache = require('node-cache'); // NodeCache library for caching
const PhoneNumber = require('awesome-phonenumber'); // Library for handling phone numbers
const config = require('./config'); // Custom configuration file
const Database = require('./src/db'); // Custom Database module
const DBS = require('./src/dbs'); // Custom DBS module
const Utils = require('./src/utils'); // Custom Utils module

// Define a session name
const sessionName = 'sessoes';

// Aliases for Baileys library components
const coreConnect = baileys.default;
const useMultiFileAuthState = baileys.useMultiFileAuthState;
const DisconnectReason = baileys.DisconnectReason;
const fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
const makeInMemoryStore = baileys.makeInMemoryStore;
const jidDecode = baileys.jidDecode;
const isJidBroadcast = baileys.isJidBroadcast;
const proto = baileys.proto;
const getContentType = baileys.getContentType;
const Browsers = baileys.Browsers;
const fetchLatestWaWebVersion = baileys.fetchLatestWaWebVersion;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore;
const WAMessageContent = baileys.WAMessageContent;
const WAMessageKey = baileys.WAMessageKey;

// Initialize a logger using pino with a silent log level
const logger = pino({ level: 'silent' });

// Create instances of custom Database and DBS classes
const DB = new Database();
const DBSX = new DBS();

// Create an in-memory store using Baileys
const store = makeInMemoryStore({ logger });

// Create a NodeCache instance
const msgRetryCounterCache = new NodeCache();

// Declare variables for later use
let client;
let lastClientMessageTime = 0;
let receivedMsgTime = {};

function smsg(conn, m, store) {
  // Check if 'm' exists, if not, return it
  if (!m) return m;

  // Define 'M' as 'proto.WebMessageInfo'
  let M = proto.WebMessageInfo;

  // Initialize 'quoted' as null
  let quoted = null;

  // Check if 'm' has no 'message' property
  if (!m.message) {
    console.log('Recebida mensagem sem objeto de chave:', m); // Log an error message
    return m; // Return 'm'
  }

  // Extract information from 'm.key'
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = conn.decodeJid(
      (m.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || ''
    );
    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || '';
  }

  // Check if 'm' has no 'key' property
  if (!m.key) {
    console.log('Recebida mensagem sem objeto de chave:', m); // Log an error message
    return m; // Return 'm'
  }

  // Process message content
  if (m.message) {
    if (m.message.ephemeralMessage && m.message.ephemeralMessage.message) {
      // Handle ephemeral messages
      m.mtype = getContentType(m.message.ephemeralMessage.message);
      m.msg = m.message.ephemeralMessage.message[m.mtype];
    } else {
      m.mtype = getContentType(m.message);
      m.msg = m.message[m.mtype];
    }
    m.msg =
      m.mtype == 'viewOnceMessage'
        ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
        : m.message[m.mtype];
    m.body =
      m.message.conversation ||
      m.msg?.caption ||
      m.msg?.text ||
      (m.mtype == 'viewOnceMessage' && m.msg.caption) ||
      m.text;

    // Extract quoted message information
    if (m.msg.contextInfo && m.msg.contextInfo.quotedMessage) {
      quoted = m.msg.contextInfo.quotedMessage;
    }
    if (m.message.contextInfo && m.message.contextInfo.quotedMessage) {
      quoted = m.message.contextInfo.quotedMessage;
      m.mentionedJid = m.message.contextInfo.mentionedJid || [];
    } else {
      m.message.contextInfo = "";
    }

    // Process quoted message if it exists
    if (m.quoted) {
      // Extract and process quoted message content
      let type = getContentType(quoted);
      m.quoted = m.quoted[type];
      if (['productMessage'].includes(type)) {
        type = getContentType(m.quoted);
        m.quoted = m.quoted[type];
      }
      if (typeof m.quoted === 'string')
        m.quoted = {
          text: m.quoted,
        };
      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id
        ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16
        : false;
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id);
      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        m.quoted.contentText ||
        m.quoted.selectedDisplayText ||
        m.quoted.title ||
        '';
      m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false;
        let q = await store.loadMessage(m.chat, m.quoted.id, conn);
        return exports.smsg(conn, q, store);
      };

      // Create a fake message object for the quoted message
      let vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      }));

      // Define methods for the quoted message
      m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) =>
        conn.copyNForward(jid, vM, forceForward, options);
      m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
    }
  }

  // Define a 'download' method if 'm.msg.url' exists
  if (m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg);

  // Define a 'reply' method
  m.reply = (text, chatId = m.chat, options = {}) => {
    return Buffer.isBuffer(text)
      ? conn.sendMedia(chatId, text, 'file', '', m, { ...options })
      : conn.sendText(chatId, text, m, { ...options });
  };

  // Define a 'copy' method
  m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));

  return m; // Return the modified message object
}

async function startCore(inDebit) {
  // Load authentication state from a file
  const { state, saveCreds } = await useMultiFileAuthState(
    `./${sessionName ? sessionName : 'session'}`
  );

  // Fetch the latest WhatsApp Web or Baileys version
  const { version, isLatest } = await fetchLatestWaWebVersion().catch(() =>
    fetchLatestBaileysVersion()
  );

  // Initialize the WhatsApp client
  client = coreConnect({
    logger,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.macOS('Desktop'),
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid: jid => isJidBroadcast(jid),
  });

  // Bind the client to the store
  store.bind(client.ev);

  // Event handler for incoming messages
  client.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      let ignoreNumber = false;
      const sender = chatUpdate.messages[0]?.key.remoteJid;

      // Save the sender as a contact if it's not a group or a broadcast
      if (sender && !sender.endsWith('@g.us') && !sender.endsWith('@broadcast') && !Utils.doNotHandleNumbers.includes(sender.replace('@s.whatsapp.net', ''))) {
        const contact = { whatsappNumber: sender };
        await DB.saveContact(contact);
      }

      const currentTime = new Date().getTime();

      // Check if the time between messages is less than the configured delay
      if (currentTime - lastClientMessageTime < config.tempoEntreMensagens) return;

      mek = chatUpdate.messages[0];
      if (!mek.message) return;
      if (mek.isGroup) return;

      // Extract the message content
      mek.message =
        Object.keys(mek.message)[0] === 'ephemeralMessage'
          ? mek.message.ephemeralMessage.message
          : mek.message;

      if (mek.key && mek.key.remoteJid === 'status@broadcast') return;

      const itsMe = sender.replace('@s.whatsapp.net', '') == config.empresa.botNumber.replace('@s.whatsapp.net', '') ? true : false;

      const phoneNumber = PhoneNumber(mek.key.remoteJid.replace('@s.whatsapp.net', '')).getNumber('international');

      if (!client.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
      if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;

      m = smsg(client, mek, store);

      if (!mek.isGroup && typeof m.body === 'string') {
        // Check if the message body contains a command
        await Utils.verificarComando(client, m.pushName, m.body, mek, DB, m.chat);
      }

      if (!mek.isGroup) receivedMsgTime[m.sender] = new Date();
      if (m.mtype === 'videoMessage' && m.body) return;

      if (mek.message && mek.message.documentMessage && !itsMe) {
        const documentMessage = mek.message.documentMessage;
        if (documentMessage.mimetype === 'application/pdf') {
          // React to a PDF document with a money emoji
          const reactionMoneyMessage = {
            react: {
              text: `💸`,  // Use the corresponding emoji
              key: mek.key,
            },
          };
          await client.sendMessage(sender, reactionMoneyMessage);
        }
      }

      // Check if 'm.body' is a number between 1 and 8
      if(!mek.isGroup && m.body && m.body.length === 1) {
        const number = parseInt(m.body);
        if (!mek.isGroup && (number >= 1 && number <= 8) && !itsMe) {
          // Check if there is a corresponding emoji in the mapping
          if (config.emojiMap[number]) {
            // Send the emoji as a reaction to the message
            const reactionMessage = {
              react: {
                text: config.emojiMap[number],  // Use the corresponding emoji
                key: mek.key,
              },
            };
            await client.sendMessage(sender, reactionMessage);
          }
        }
      }

      if (!mek.isGroup && typeof m.body === 'string' && !itsMe && !Utils.doNotHandleNumbers.includes(sender.replace('@s.whatsapp.net', ''))) {
        // Convert the message text and keywords to lowercase to avoid case sensitivity issues
        const mensagemLowerCase = m.body.toLowerCase();

        // Search for a CEP (zip code) in the message and respond if found
        Utils.searchCEP(axios, client, mensagemLowerCase, sender);

        let foundKeyword = null; // Initialize as null

        // Check if any menu keywords or their variants are present in the message
        Object.keys(config.palavrasChave).some((keyword) => {
          const variants = config.palavrasChave[keyword];
          const foundVariant = variants.find((variant) => mensagemLowerCase.includes(variant.toLowerCase()));
          if (foundVariant) {
            foundKeyword = keyword; // Store the found keyword
            return true; // Exit the loop as soon as the first match is found
          }
          return false; // Continue searching
        });

        
        if (foundKeyword) {
          // Send a response message informing about the dish found
          const cliente = sender.replace('@s.whatsapp.net', '');
          const response = `⚠️⚠️⚠️ *O número ${cliente} quer fazer um pedido. Palavra-chave encontrada: ${foundKeyword}. Olhar a conversa.* ⚠️⚠️⚠️`;
          await client.sendMessage(config.empresa.botNumber, { text: response });
          ignoreNumber = true;
        }

      }
            
      // Require and execute the 'core' module with relevant parameters
      require('./core')(client, m, chatUpdate, ignoreNumber);

      if (!mek.isGroup) {
        // Calculate the response time for the message
        const responseTime = new Date() - receivedMsgTime[m.sender];

        // Save data in the ResponseTimes table only if the number is not blocked
        if (sender && !sender.endsWith('@g.us') && !sender.endsWith('@broadcast') && !Utils.doNotHandleNumbers.includes(sender.replace('@s.whatsapp.net', ''))) {
          // Create a new entry in the ResponseTimes table
          await DB.ResponseTimes.create({
            sender: m.sender,
            responseTime: responseTime,
            timestamp: new Date(),
          });
        }
      }

      // Update the time of the last client message
      lastClientMessageTime = currentTime;

    } catch (err) {
      console.log(err);
    }
  });

  // Listen for chat updates
  client.ev.on('chat-update', async (update) => {
    if (update.messages) {
      for (const message of update.messages.all()) {
        // Check if the action is 'ephemeral_message'
        if (message.action && message.action.type === 'ephemeral_message') {
          // Do not send a response
          continue;
        }
      }
    }
  });

  // Create a map to track unhandled promise rejections
  const unhandledRejections = new Map();

  // Initialize the restart count
  let restartCount = 0;

  // Define the maximum number of restarts allowed
  const MAX_RESTARTS = 3;

  // Listen for unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    // Set the unhandled rejection in the map
    unhandledRejections.set(promise, reason);

    // Log the unhandled rejection
    console.error('Unhandled rejection in:', promise, 'reason:', reason);

    // Check if the maximum number of restarts has not been reached
    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log(`Restarting the process (attempt ${restartCount})...`);
      // Restart the core process
      startCore();
    } else {
      // Maximum restarts reached, exit the process
      console.log('Maximum number of restarts reached. Exiting the process.');
      process.exit();
    }
  });

  // Listen for rejectionHandled event and remove from the map
  process.on('rejectionHandled', (promise) => {
    unhandledRejections.delete(promise);
  });

  // Listen for 'Something went wrong' event
  process.on('Something went wrong', function (err) {
    // Log the captured exception
    console.log('Exception captured: ', err);

    // Exit the process
    process.exit();
  });

  // Define 'decodeJid' in the client object
  client.decodeJid = (jid) => {
    // Check if 'jid' is defined
    if (!jid) return jid;
    
    // Check if 'jid' matches the pattern ':number@' (indicating a specific port)
    if (/:\d+@/gi.test(jid)) {
      // Decode the 'jid' using 'jidDecode' function or set it as an empty object
      let decode = jidDecode(jid) || {};
      
      // Return the decoded user and server if available, or the original 'jid'
      return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
    } else {
      // Return 'jid' as is if it doesn't match the pattern
      return jid;
    }
  };

  // Listen for 'contacts.update' event in the client event emitter
  client.ev.on('contacts.update', (update) => {
    // Iterate through the 'update' array
    for (let contact of update) {
      // Decode the contact's ID using the custom 'decodeJid' function
      let id = client.decodeJid(contact.id);
      
      // Check if 'store' and 'store.contacts' are defined
      if (store && store.contacts) {
        // Update the 'store.contacts' with the decoded contact information
        store.contacts[id] = { id, name: contact.notify };
      }
    }
  });

  // Define 'getName' in the client object
  client.getName = (jid, withoutContact = false) => {
    // Decode the 'jid' using 'decodeJid' function
    id = client.decodeJid(jid);
    // Set 'withoutContact' as 'client.withoutContact' or the provided 'withoutContact' parameter
    withoutContact = client.withoutContact || withoutContact;
    let v;
    if (id.endsWith('@g.us')) {
      // If 'id' ends with '@g.us' (indicating a group chat), return a promise
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = client.groupMetadata(id) || {};
        resolve(
          v.name ||
            v.subject ||
            PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international')
        );
      });
    } else {
      // If 'id' is not a group chat
      v =
        id === '0@s.whatsapp.net'
          ? {
              id,
              name: 'WhatsApp',
            }
          : id === client.decodeJid(client.user.id)
          ? client.user
          : store.contacts[id] || {};
    }
    // Return the contact name or subject (if available) or the international phone number
    return (
      (withoutContact ? '' : v.name) ||
      v.subject ||
      v.verifiedName ||
      PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    );
  };

  // Set 'client.public' to true
  client.public = true;

  // Define a custom function 'serializeM' in the client object
  client.serializeM = (m) => smsg(client, m, store);




  client.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'close') {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log('Sessão inválida, por favor, exclua a sessão e escaneie novamente');
        const directoryPath = path.join(__dirname, 'sessoes');
        Util.delDirs(directoryPath);
        client.logout()
        process.exit();
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log('Conexão fechada, reconectando...');
        startCore();
      } else if (reason === DisconnectReason.connectionLost) {
        console.log('Conexão perdida com o servidor, reconectando...');
        startCore();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log('Conexão substituída, uma nova sessão foi aberta, reinicie o bot');
        process.exit();
      } else if (reason === DisconnectReason.loggedOut) {
        console.log('Dispositivo desconectado, por favor, exclua a pasta da sessão e escaneie novamente.');
        const directoryPath = path.join(__dirname, 'sessoes');
        Util.delDirs(directoryPath);
        client.logout()
        process.exit();
      } else if (reason === DisconnectReason.restartRequired) {
        console.log('Reinício necessário, reiniciando...');
        startCore();
      } else if (reason === DisconnectReason.timedOut) {
        console.log('Conexão expirada, reconectando...');
        startCore();
      } else {
        console.log(`Razão de desconexão desconhecida: ${reason}|${connection}`);
        startCore();
      }
    } else if (connection === 'open') {
      console.log(`AutoAtende v.${config.botVersion} conectou ao servidor com sucesso.`);
      console.log(`AutoAtende usando WA v${version.join('.')}, é a mais recente? ${isLatest ? "Sim" : "Não"}`);

      await client.sendMessage(config.botAdmin, {
        text: `🤖 ${config.empresa.nomeDaLoja} está ligado.`,
      });

      if (inDebit === true) {
        await client.sendMessage(config.botAdmin, {
          text: `🤖 ${config.empresa.nomeDaLoja} está em débito. Favor regularizar. Sujeito a desligamento do sistema.`,
        });        
      }
    }
  });

  // Listen for 'creds.update' event and call the 'saveCreds' function
  client.ev.on('creds.update', saveCreds);

  // Define a function 'getBuffer' that fetches data from a URL and returns it as an array buffer
  const getBuffer = async (url, options) => {
    try {
      // Set 'options' to an empty object if not provided
      options ? options : {};
      const res = await axios({
        method: 'get',
        url,
        headers: {
          DNT: 1,
          'Upgrade-Insecure-Request': 1,
        },
        ...options,
        responseType: 'arraybuffer', // Set the response type to 'arraybuffer'
      });
      // Return the data from the response
      return res.data;
    } catch (err) {
      // Return the error if there's an issue
      return err;
    }
  };

  // Define a function 'sendImage' in the client object to send an image
  client.sendImage = async (jid, path, caption = '', quoted = '', options) => {
    // Determine the source of the image based on 'path' type
    let buffer = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split(',')[1], 'base64')
      : /^https?:\/\//.test(path)
      ? await await getBuffer(path)
      : fs.existsSync(path)
      ? fs.readFileSync(path)
      : Buffer.alloc(0);
    // Send the image message to 'jid' with the provided caption, quoted message, and options
    return await client.sendMessage(
      jid,
      { image: buffer, caption: caption, ...options },
      { quoted: undefined }
    );
  };

  // Define a function 'sendText' in the client object to send a text message
  client.sendText = (jid, text, quoted = '', options) =>
    client.sendMessage(jid, { text: text, ...options }, { quoted: undefined });

  // Define a function 'cMod' in the client object to modify a message
  client.cMod = (jid, copy, text = '', sender = client.user.id, options = {}) => {
    // Determine the message type (e.g., text, image, etc.)
    let mtype = Object.keys(copy.message)[0];
    let isEphemeral = mtype === 'ephemeralMessage';

    // If the message is ephemeral, adjust the message type
    if (isEphemeral) {
      mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
    }

    // Extract the message content
    let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
    let content = msg[mtype];

    // If the content is a string, convert it to an object with 'text' property
    if (typeof content === 'string') {
      content = { text: content };
    }

    // If there's 'caption', set it as the 'text', or use the provided 'text'
    if (content.caption) {
      content.caption = text || content.caption;
    } else if (content.text) {
      content.text = text || content.text;
    }

    // Merge content with the provided options
    content = {
      ...content,
      ...options,
    };

    // Update the message content with the modified content
    msg[mtype] = content;

    // Determine the sender based on participant or remoteJid
    if (copy.key.participant) {
      sender = copy.key.participant = sender || copy.key.participant;
    } else if (copy.key.remoteJid.includes('@s.whatsapp.net')) {
      sender = sender || copy.key.remoteJid;
    } else if (copy.key.remoteJid.includes('@broadcast')) {
      sender = sender || copy.key.remoteJid;
    }

    // Update the remoteJid and fromMe properties in the message key
    copy.key.remoteJid = jid;
    copy.key.fromMe = sender === client.user.id;

    // Return the modified message as a WebMessageInfo object
    return proto.WebMessageInfo.fromObject(copy);
  };
  return client;
}

// Set an interval to run the 'cleanOldFiles' function every 3600000 milliseconds (1 hour)
setInterval(Utils.cleanOldFiles, 3600000);

// Check if the bot's number (without '@s.whatsapp.net') is paid in the DBSX
if (DBSX.isPaid(config.empresa.botNumber.replace('@s.whatsapp.net', ''))) {
  // If the bot's number is paid, start the 'startCore' function with 'false' parameter
  startCore(false);
} else {
  // If the bot's number is not paid, start the 'startCore' function with 'true' parameter
  startCore(true);
}