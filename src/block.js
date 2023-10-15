
const config = require('../conf/config');

class Block {
    constructor() {
        this.version = "1.0.0";
    }

    async insert(DB, phoneNumber) {
        try {
            // Verifique se o número já está na lista de bloqueados no banco de dados
            const existingBlock = await DB.Block.findOne({ where: { phoneNumber } });

            if (!existingBlock) {
                // Se o número não estiver na lista, insira-o
                await DB.Block.create({ phoneNumber });
                return true;
            } else {
                return false; // O número já está bloqueado
            }
            } catch (error) {
                console.error('Erro ao inserir número bloqueado:', error);
            return false;
        }
    }

    async remove(DB, phoneNumber) {
        try {
            // Verifique se o número está na lista de bloqueados no banco de dados
            const existingBlock = await DB.Block.findOne({ where: { phoneNumber } });

            if (existingBlock) {
                // Se o número estiver na lista, remova-o
                await DB.Block.destroy({ where: { phoneNumber } });
                return true;
            } else {
                return false; // O número não está na lista
            }
        } catch (error) {
            console.error('Erro ao remover número bloqueado:', error);
            return false;
        }
    }

    async isBlocked(DB, phoneNumber) {
        try {
            // Verifique se o número está na lista de bloqueados no banco de dados
            const existingBlock = await DB.Block.findOne({ where: { phoneNumber } });

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
