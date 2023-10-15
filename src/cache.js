const fs = require('fs');
const CryptoJS = require('crypto-js');
const path = require('path');
const config = require('../conf/config');

class Cache {
  constructor() {
    this.version = "1.0.0";
    this.cacheFile = path.join(__dirname, '..', config.dir.cache, 'c.dat');
    this.secretKey = '3H9!n$7Km*pL#5zYqR8vFwTtJ@1S6DgC4oUaE2VhXyZbNlAeP7iQsO';
  }

  save(data) {
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
    fs.writeFileSync(this.cacheFile, encryptedData);
  }

  load() {
    try {
      // Verifique se o arquivo de cache existe
      if (fs.existsSync(this.cacheFile)) {
        const encryptedData = fs.readFileSync(this.cacheFile, 'utf8');

        // Verifique se o arquivo não está vazio
        if (encryptedData) {
          const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
          const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);

          // Verifique se a string descriptografada não está vazia
          if (decryptedData) {
            return JSON.parse(decryptedData);
          }
        }
      } else {
        console.log('O arquivo de cache não existe ou está vazio. Criando um novo...');
        // Crie um novo arquivo de cache vazio
        fs.writeFileSync(this.cacheFile, '');
        return null;
      }
    } catch (error) {
      console.error('Erro ao carregar o cache:', error);
      return null;
    }
  }
}

module.exports = Cache;
