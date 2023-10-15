const baileys = require('@whiskeysockets/baileys'); // Baileys library for WhatsApp interactions
const baileysbottle = require('baileys-bottle-new');
const pino = require('pino'); // Logging library
const util = require('util');
const { Boom } = require('@hapi/boom'); // Boom library from hapi
const fs = require('fs'); // Node.js filesystem module
const path = require('path');
const { config } = require('../conf/config.js');
  
  console.clear();
  console.log("Initializing DB...");
  BaileysBottle.init({
    type: config.datasource.bottle.dialect,
    host: config.datasource.bottle.host,
    port: config.datasource.bottle.port,
    username: config.datasource.bottle.user,
    password: config.datasource.bottle.pwd,
    database: config.datasource.bottle.db,
    synchronize: config.datasource.bottle.sync,
    logging: config.datasource.bottle.log
  }).then(async (bottle) => {
    console.log("DB initialized");
    const client = async (clientName) => {
      console.log(`Starting client "${clientName}"`);
      
      const logger = log.child({});
      logger.level = "silent";
  
      console.log("Creating store...");
      const { auth, store } = await bottle.createStore(clientName);
      console.log("Creating auth...");
      const { state, saveState } = await auth.useAuthHandle();
      console.log("Done");
  
      const startSocket = async () => {
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
  
        const sock = makeWASocket({
          version,
          printQRInTerminal: true,
          auth: state,
          logger,
        });
  
        store.bind(sock.ev);
  
        sock.ev.process(async (events) => {
          //
          // Start your bot code here...
          //
          if (events["messages.upsert"]) {
            const upsert = events["messages.upsert"];
            console.log("recv messages ", JSON.stringify(upsert, undefined, 2));
            if (upsert.type === "notify") {
              for (const msg of upsert.messages) {
                if (!msg.key.fromMe) {
                  // mark message as read
                  await sock.readMessages([msg.key]);
                }
              }
            }
          }
          //
          // End your bot code here...
          //
  
          // credentials updated -- save them
          if (events["creds.update"]) await saveState();
  
          if (events["connection.update"]) {
            const update = events["connection.update"];
            const { connection, lastDisconnect } = update;
            connection === "open"
              ? console.log("Connected")
              : connection === "close"
              ? (lastDisconnect?.error)?.output?.statusCode !==
                DisconnectReason.loggedOut
                ? startSocket()
                : console.log("Connection closed. You are logged out.")
              : null;
          }
        });
      };
  
      startSocket();
    };
  
    await client("client 1");
    // await client("client 2");
    // await client("client 3");
    // ...
  });
  