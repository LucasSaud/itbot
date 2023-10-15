
const config = require('../conf/config');
const { Sequelize, DataTypes } = require('sequelize');


class Block {
    constructor() {
        this.version = "1.0.0";

        // Configure a Sequelize instance to connect to your MariaDB database
        this.sequelize = new Sequelize(
            config.datasource.data.db,
            config.datasource.data.user,
            config.datasource.data.pwd, {
            host: config.datasource.data.host,
            dialect: config.datasource.data.dialect,
            logging: config.datasource.data.log,     // Disable logging
            timezone: '-03:00'  // Set timezone
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
        // Sincronize o modelo com o banco de dados
        this.sequelize.sync({ alter: true });
    }

    async insert(phoneNumber) {
        try {
            // Verifique se o número já está na lista de bloqueados no banco de dados
            const existingBlock = await this.Blocked.findOne({ where: { phoneNumber } });

            if (!existingBlock) {
                // Se o número não estiver na lista, insira-o
                await this.Blocked.create({ phoneNumber });
                return true;
            } else {
                return false; // O número já está bloqueado
            }
            } catch (error) {
                console.error('Erro ao inserir número bloqueado:', error);
            return false;
        }
    }

    async remove(phoneNumber) {
        try {
            // Verifique se o número está na lista de bloqueados no banco de dados
            const existingBlock = await this.Blocked.findOne({ where: { phoneNumber } });

            if (existingBlock) {
                // Se o número estiver na lista, remova-o
                await this.Blocked.destroy({ where: { phoneNumber } });
                return true;
            } else {
                return false; // O número não está na lista
            }
        } catch (error) {
            console.error('Erro ao remover número bloqueado:', error);
            return false;
        }
    }

    async isBlocked(phoneNumber) {
        try {
            // Verifique se o número está na lista de bloqueados no banco de dados
            const existingBlock = await this.Blocked.findOne({ where: { phoneNumber } });

            if (existingBlock) {
                return true; // O número está bloqueado
            } else {
                return false; // O número não está bloqueado
            }
        } catch (error) {
            console.error('Erro ao verificar se o número está bloqueado:', error);
            return false;
        }
    }
}


module.exports = Block;

async function main() {

    // Uso da classe BlockList
    const blockList = new Block();
    await blockList.isBlocked('5516997980088').then((blocked) => {
    if (blocked) {
        console.log('isBlocked >> 5516997980088 Número está na lista de bloqueados.');
    } else {
        console.log('isBlocked >> 5516997980088 Número não está na lista de bloqueados.');
    }
    });

    await blockList.insert('5516993636362').then((blocked) => {
        if(blocked) {
            console.log('insert >> Número adicionado a lista de bloqueio.')
        } else {
            console.log('insert >> O número já existe na lista de bloqueio');
        }
    });

    await blockList.remove('5516993636362').then((blocked) => {
        if(blocked) {
            console.log('remove >> Número removido da lista de bloqueio.')
        } else {
            console.log('remove >> Ocorreu um erro ao remover da lista de bloqueio');
        }
    });

}

main();
