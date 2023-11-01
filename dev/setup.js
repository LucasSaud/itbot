const fs = require('fs');
const path = require('path');
const semver = require('semver');
const readline = require('readline');
const config = require('../conf/config.js');
const configLoja01 = require('../conf/config.loja01.js');
const Database = require('../src/db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//const DB = new Database();

function createDirectoriesIfNotExists() {
  if (config.dir && typeof config.dir === 'object') {
    for (const key in config.dir) {
      const subdirectory = config.dir[key];
      const absolutePath = path.join(__dirname, '..', subdirectory);

      if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
        console.log(`Diretório criado: ${absolutePath}`);
      }
    }
  } else {
    console.log('Nenhum diretório a ser criado de acordo com config.dir.');
  }
}

function updateVersionAndAddNewConfig() {
  let doNothing = false;
  if (
    semver.gt(config.botVersion, configLoja01.botVersion) &&
    semver.valid(config.botVersion) &&
    semver.valid(configLoja01.botVersion)
  ) {
    console.log(`A versão em config é maior (${config.botVersion}) do que em configLoja01 (${configLoja01.botVersion}). Atualizando...`);
    configLoja01.botVersion = config.botVersion;
  } else {
    console.log('Nenhuma atualização necessária de versão.');
    doNothing = true;
  }

  if (doNothing !== true) {
    // Verificar e adicionar novas configurações
    for (const key in config) {
      if (!(key in configLoja01)) {
        console.log(`Nova configuração encontrada em config: ${key}`);
        configLoja01[key] = config[key];
      }
    }

    // Remover configurações ausentes em config.js
    for (const key in configLoja01) {
      if (!(key in config)) {
        console.log(`Configuração ausente em config.js: ${key}. Removendo de configLoja01.`);
        delete configLoja01[key];
      }
    }

    const backupFileName = path.join(__dirname, '..', config.dir.backup, 'config.loja01.backup.js');
    const configLoja01File = path.join(__dirname, '..', 'conf', 'config.loja01.js');
    
    // Utilize um replacer personalizado para manter o formato do objeto
    const updatedConfig = `module.exports = ${JSON.stringify(configLoja01, null, 2)
      .replace(/"([^"]+)":/g, '$1:')};`;

    fs.copyFileSync(configLoja01File, backupFileName);
    console.log(`Backup criado: ${backupFileName}`);

    fs.writeFileSync(configLoja01File, updatedConfig, 'utf-8');
    console.log('Versão atualizada.');
  }
}


function menu() {
  console.log('Selecione uma opção:');
  console.log('1) Nova Instalação');
  console.log('2) Fazer Backup');
  console.log('3) Procurar Atualizações');
  console.log('4) Salvar Configurações');

  rl.question('Opção: ', (choice) => {
    switch (choice) {
      case '1':
        createDirectoriesIfNotExists(); // Chama a função de criação de diretórios no caso 1
        console.log('Diretórios verificados e criados, se necessário.');
        break;
      case '2':
        // Implementar a lógica para Fazer Backup aqui
        DB.backup();
        break;
      case '3':
        // Implementar a lógica para Procurar Atualizações aqui
        console.log('Em desenvolvimento 03.');
        break;
      case '4':
        updateVersionAndAddNewConfig();
        break;
      default:
        console.log('Opção inválida.');
        break;
    }
    rl.close();
  });
}

menu();
