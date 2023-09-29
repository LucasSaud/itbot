// Import necessary modules and components from Sequelize
const { Sequelize, DataTypes, Op } = require("sequelize");

// Define a class named 'DBS' for database operations
class DBS {
  constructor() {
    // Initialize Sequelize DataTypes and Op for convenience
    this.DataTypes = DataTypes;
    this.Op = Op;

    // Create a Sequelize instance with database connection details
    this.sequelize = new Sequelize(
      "u276801829_clientes",
      "u276801829_italinbot",
      "?qOi6jM7r6",
      {
        host: "154.56.48.154",
        dialect: "mysql",
        logging: false,
        timezone: "-03:00",
      }
    );

    // Define a 'Clientes' model representing client information
    this.Clientes = this.sequelize.define(
      "Cliente",
      {
        // Define various fields and their data types
        nomeDaLoja: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cidadeDaLoja: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        responsavel: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        numeroDoBot: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        dataInicial: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        dataVencimento: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        dataFinal: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        estapago: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        // Disable timestamps for this model
        timestamps: false,
      }
    );

    // Initialize the database connection
    this.init();
  }

  // Initialize the database connection and synchronize the schema
  async init() {
    try {
      await this.sequelize.authenticate();
      await this.sequelize.sync({ alter: true });
    } catch (error) {
      console.error("Error connecting to the database:", error);
    }
  }

  // Check if a client with the given 'numero' is paid
  async isPaid(numero) {
    try {
      // Query the database to find a paid client with the specified 'numero'
      const cliente = await this.Clientes.findOne({
        where: {
          numeroDoBot: numero,
          estapago: 1,
        },
      });

      if (cliente) {
        console.log(`Cliente: ${cliente.nomeDaLoja}`);
        console.log("Sistema liberado.");
        return true;
      }
    } catch (error) {
      console.error("Erro ao verificar o sistema:", error);
      return false;
    }
  }
}

// Export the 'DBS' class for use in other modules
module.exports = DBS;