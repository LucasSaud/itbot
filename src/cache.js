const fs = require('fs');
const CryptoJS = require('crypto-js');
const path = require('path');
const config = require('../conf/config');

const cacheFile = path.join(__dirname, '..', 'img', config.cacheDir, 'c.dat');  
const secretKey = '3H9!n$7Km*pL#5zYqR8vFwTtJ@1S6DgC4oUaE2VhXyZbNlAeP7iQsO';

function saveToCache(data) {
  const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  fs.writeFileSync(cacheFile, encryptedData);
}

function loadFromCache() {
  try {
    const encryptedData = fs.readFileSync(cacheFile, 'utf8');
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Erro ao carregar o cache:', error);
    return null;
  }
}

module.exports = {
  saveToCache,
  loadFromCache,
};
