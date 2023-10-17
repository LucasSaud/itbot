const JSZip = require('jszip');
const fs = require('fs').promises;
const path = require('path');
const mysqldump = require('mysqldump');
const { Sequelize, DataTypes, Op } = require('sequelize');
const Utils = require('./utils');
const config = require('../conf/config');

class Database {
  constructor() {
    this.version = '1.2.0';
    
    // Import necessary modules
    this.DataTypes = DataTypes;
    this.Op = Op;

    // Create a Sequelize instance for database connection
    this.sequelize = new Sequelize(
      config.datasource.data.db,
      config.datasource.data.user,
      config.datasource.data.pwd, {
        host: config.datasource.data.host,
        dialect: config.datasource.data.dialect,
        logging: config.datasource.data.log,     // Disable logging
        timezone: '-03:00'  // Set timezone
    });

    // Define all models
    this.defineModels();

    // Initialize the database connection
    this.init();
  }

  async init() {
    try {
      // Authenticate the database connection
      await this.sequelize.authenticate();
      
      // Synchronize models with the database, altering if needed
      this.sequelize.sync({ alter: true });
    } catch (error) {
      console.error('Erro ao conectar:', error);
    }
  }

  async defineModels() {
    // Define a model for log messages
    this.Logs = this.sequelize.define('Logs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      logMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    });

    // Define a model for messages
    this.Message = this.sequelize.define('Messages', {
      sender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    });
  
    // Defina o modelo da tabela Block usando o Sequelize
    this.Blocked = this.sequelize.define('Blocks', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Defina o número de telefone como único
      },
      createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: this.sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: this.sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Define a model for contacts
    this.Contacts = this.sequelize.define('Contacts', {
      whatsappNumber: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      deliveryOrders: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      pickupOrders: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastOrderDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isMktSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isInactive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    });

    // Define a model for response times
    this.ResponseTimes = this.sequelize.define('ResponseTimes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      responseTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    }, {
      timestamps: false  // Disable default timestamps
    });
  }

  async saveLogs(logMessage) {
    try {
      // Create a new log entry in the Logs model
      const log = await this.Logs.create({
        logMessage: logMessage,
      });
      if (config.showLog === true) console.log(`Registro de evento salvo. ID: ${log.id}`);
    } catch (error) {
      console.error('Erro ao salvar evento no banco de dados:', error);
    }
  }

  async updateContact(whatsappNumber, deliveryOrders, pickupOrders) {
    try {
      // Find an existing contact by whatsappNumber
      const existingContact = await this.Contacts.findOne({
        where: {
          whatsappNumber: whatsappNumber,
        },
      });
  
      if (existingContact) {
        // Update contact fiel&&ds if deliveryOrders or pickupOrders are 1
        if (deliveryOrders === 1 || pickupOrders === 1) {
          const updatedFields = {};
  
          if (deliveryOrders === 1) {
            updatedFields.deliveryOrders = existingContact.deliveryOrders + 1;
          }
  
          if (pickupOrders === 1) {
            updatedFields.pickupOrders = existingContact.pickupOrders + 1;
          }
  
          updatedFields.lastOrderDate = new Date();
  
          // Update the contact with the new fields
          const updatedContact = await existingContact.update(updatedFields);
        }
      } else {
        if (!Utils.isBlocked(whatsappNumber.replace('@s.whatsapp.net', ''))) {
          // Create a new contact if it doesn't exist
          const newContact = await this.Contacts.create({
            whatsappNumber: whatsappNumber,
            deliveryOrders: deliveryOrders === 1 ? 1 : 0,
            pickupOrders: pickupOrders === 1 ? 1 : 0,
            lastOrderDate: new Date(),
            isMktSent: 0
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
    }
  }

  async saveContact(contact) {
    try {
      // Check if the contact with the given whatsappNumber already exists
      const existingContact = await this.Contacts.findOne({
        where: { whatsappNumber: contact.whatsappNumber },
      });

      // Create a new contact if it doesn't exist
      if (!existingContact && !Utils.isBlocked(contact.whatsappNumber.replace('@s.whatsapp.net', ''))) {
        await this.Contacts.create({
          whatsappNumber: contact.whatsappNumber,
          deliveryOrders: 0,
          pickupOrders: 0,
          lastOrderDate: new Date(),
          isMktSent: 0
        });

        if (config.showLog === true) console.log(`[ AVISO ] Contato salvo no banco de dados: ${contact.whatsappNumber}`);
      }
    } catch (error) {
      console.error('[ ERRO ] Erro ao salvar contato no banco de dados:', error);
    }
  }

  async backup() {
    try {
      // Chame o método defineModels para garantir que as tabelas estejam definidas corretamente
      this.defineModels();

      // Synchronize models with the database
      await this.sequelize.sync();

      // Nome do arquivo de backup com timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const sqlBackupFileName = `backup-${timestamp}.sql`;
      const sqlBackupFilePath = path.join(__dirname, '..', config.dir.backup, sqlBackupFileName);

      // Dump the database to a SQL file
      await mysqldump({
        connection: {
          host: 'localhost',
          user: 'italinbot',
          password: 'Brx2045rb@',
          database: 'italin_db',
        },
        dumpToFile: sqlBackupFilePath,
      });

      // Crie um arquivo ZIP e adicione o arquivo SQL a ele
      const zip = new JSZip();
      const sqlData = await fs.readFile(sqlBackupFilePath);
      zip.file(sqlBackupFileName, sqlData);

      // Nome do arquivo ZIP de backup
      const zipBackupFileName = `backup-${timestamp}.zip`;
      const zipBackupFilePath = path.join(__dirname, '..', config.dir.backup, zipBackupFileName);

      // Crie o arquivo ZIP
      const zipData = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE'
      });
      await fs.writeFile(zipBackupFilePath, zipData);

      // Exclua o arquivo SQL não compactado
      await fs.unlink(sqlBackupFilePath);

    if (config.showLog === true) console.log(`Backup do banco de dados criado em ${zipBackupFilePath}`);
      return zipBackupFileName;
    } catch (error) {
      console.error('Erro ao criar o backup do banco de dados:', error);
      return false;
    }
  }

  async contactsUpdatePoints(num, cmd) {
    try {
      // Encontre o contato com base no número de telefone (whatsappNumber)
      const contact = await this.Contacts.findOne({
        where: { whatsappNumber: num },
      });
  
      if (contact) {
        // Verifique se o comandoNum existe na tabela de pontuações
        if (config._cmdPoints[cmd] !== undefined) {
          const points = config._cmdPoints[cmd];
  
          // Atualize a pontuação do usuário
          await contact.update({ points: contact.points + points });
        } else {
          console.error('Comando numérico inválido');
        }
      } else {
        console.error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao atualizar os pontos do usuário:', error);
    }
  }

}

module.exports = Database;
