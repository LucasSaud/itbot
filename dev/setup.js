const fs = require('fs');
const path = require('path');
const semver = require('semver');
const readline = require('readline');
const config = require('../conf/config.js');
const configLoja01 = require('../conf/config.loja01.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
<<<<<<< Updated upstream
    console.log('Nenhuma atualização necessária de versao.');
    doNothing = true;
  }

  if(doNothing != true) {
=======
    console.log('Nenhuma atualização necessária de versão.');
    doNothing = true;
  }

  if (doNothing !== true) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const backupFileName = path.join(__dirname, '..', 'conf', 'bkp', 'config.loja01.backup.js');
    const configLoja01File = path.join(__dirname, '..', 'conf', 'config.loja01.js');
    fs.copyFileSync(configLoja01File, backupFileName);
    console.log(`Backup criado: ${backupFileName}`);
  
    const updatedConfig = JSON.stringify(configLoja01, null, 2);
    fs.writeFileSync(configLoja01File, `module.exports = ${updatedConfig};`, 'utf-8');
=======

    const backupFileName = path.join(__dirname, '..', 'conf', 'bkp', 'config.loja01.backup.js');
    const configLoja01File = path.join(__dirname, '..', 'conf', 'config.loja01.js');
    
    // Utilize um replacer personalizado para manter o formato do objeto
    const updatedConfig = `module.exports = ${JSON.stringify(configLoja01, null, 2)
      .replace(/"([^"]+)":/g, '$1:')};`;

    fs.copyFileSync(configLoja01File, backupFileName);
    console.log(`Backup criado: ${backupFileName}`);

    fs.writeFileSync(configLoja01File, updatedConfig, 'utf-8');
>>>>>>> Stashed changes
    console.log('Versão atualizada.');
  }
}

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
function menu() {
  console.log('Selecione uma opção:');
  console.log('1) Nova Instalação');
  console.log('2) Fazer Backup');
  console.log('3) Procurar Atualizações');
  console.log('4) Salvar Configurações');

  rl.question('Opção: ', (choice) => {
    switch (choice) {
      case '1':
        // Implementar a lógica para Nova Instalação aqui
        console.log('Em desenvolvimento 01.');
        break;
      case '2':
        // Implementar a lógica para Fazer Backup aqui
        console.log('Em desenvolvimento 02.');
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
