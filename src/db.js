const { Sequelize, DataTypes, Op } = require('sequelize');
const Utils = require('./utils.js');
const config = require('../conf/config.js');

class Database {
  constructor() {
    // Import necessary modules
    this.DataTypes = DataTypes;
    this.Op = Op;

    // Create a Sequelize instance for database connection
    this.sequelize = new Sequelize('italin_db', 'italinbot', 'Brx2045rb@', {
      host: 'localhost',
      dialect: 'mariadb',
      logging: false,     // Disable logging
      timezone: '-03:00'  // Set timezone
    });

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

    // Initialize the database connection
    this.init();
  }

  async init() {
    try {
      // Authenticate the database connection
      await this.sequelize.authenticate();
      
      // Synchronize models with the database, altering if needed
      await this.sequelize.sync({});
    } catch (error) {
      console.error('Erro ao conectar:', error);
    }
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
}

module.exports = Database;
