const fs = require('fs');
const CryptoJS = require('crypto-js');
const path = require('path');
const config = require('../conf/config');

const cacheFile = path.join(__dirname, '..', config.dir.cache, 'c.dat');  
const secretKey = '3H9!n$7Km*pL#5zYqR8vFwTtJ@1S6DgC4oUaE2VhXyZbNlAeP7iQsO';

function saveToCache(data) {
  const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  fs.writeFileSync(cacheFile, encryptedData);
}

function loadFromCache() {
  try {
    // Verifique se o arquivo de cache existe
    if (fs.existsSync(cacheFile)) {
      const encryptedData = fs.readFileSync(cacheFile, 'utf8');

      // Verifique se o arquivo não está vazio
      if (encryptedData) {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
        // Verifique se a string descriptografada não está vazia
        if (decryptedData) {
          return JSON.parse(decryptedData);
        }
      }
    } else {
      console.log('O arquivo de cache não existe ou está vazio. Criando um novo...');
      // Crie um novo arquivo de cache vazio
      fs.writeFileSync(cacheFile, '');
      return null;
    }
  } catch (error) {
    console.error('Erro ao carregar o cache:', error);
    return null;
  }
}

module.exports = {
  saveToCache,
  loadFromCache,
};
