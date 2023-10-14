const os = require('os');
const process = require('process');
const util = require('util');

// Função para formatar tempo em minutos e segundos
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} minutos e ${remainingSeconds} segundos`;
}

class Command {
  constructor() {
    this.version = '1.0.0';
    // List of specific commands with !
    this.specificCommands = ["!entrega", "!retirada", "!aviso", "!bloqueia", "!desbloqueia", "!stats", "!status", "!restart"];
    this.menuWords = ["sobre","horario","cardapio","endereco","tempo","pedido","pagamento","consumo","atendente"];
  }

  /**
   * Checks for a single command in the provided string.
   * @param {string} inputString - The input string to check for a command.
   * @returns {object|string} - An object with command details or a message if the input is not a recognized command.
   */
  check(inputString) {
    // Initialize the variables to store the found command and arguments
    let foundCommand = null;
    let argument01 = null;
    let argument02 = null;

    // Check specific commands with !
    for (const cmd of this.specificCommands) {
      if (inputString.startsWith(cmd)) {
        foundCommand = cmd;
        break; // Stop searching after finding the first command
      }
    }

    // Check numeric commands
    const numericRegex = /^[0-8]$/;
    if (numericRegex.test(inputString)) {
      foundCommand = inputString;
    }

    // Check administrative commands starting with "9"
    if (inputString.startsWith("9 ")) {
      const args = inputString.split(" ");
      if (args.length >= 2) {
        foundCommand = args[0];
        argument01 = args[1];
        if (args.length === 3 && this.isValidSecondArgument(args[2])) {
          argument02 = args[2];
        }
      }
    }

    if (foundCommand) {
      const result = {
        command: foundCommand,
      };
      if (argument01 !== null || argument01 !== undefined) {
        result.argument01 = argument01;
      }
      if (argument02 !== null || argument02 !== undefined) {
        result.argument02 = argument02;
      }
      return result;
    } else {
      return `Ignorando, palavra: ${inputString} não é um comando.`;
    }
  }

  /**
   * Checks if the provided string is a valid second argument (1 to 6).
   * @param {string} argument - The string to check as a second argument.
   * @returns {boolean} - True if the string is a valid second argument, false otherwise.
   */
  isValidSecondArgument(argument) {
    // Check if the argument is an integer between 1 and 6
    const intValue = parseInt(argument);
    return !isNaN(intValue) && intValue >= 1 && intValue <= 6;
  }

    /**
   * Checks if the provided string contains any of the bot menu words.
   * @param {string} inputString - The input string to check.
   * @returns {array} - An array of bot menu words found in the input string.
   */
    checkBotMenuWordsInString(inputString) {
      const normalizedInput = inputString.toLowerCase();
      const foundWords = this.menuWords.filter(word => normalizedInput.includes(word));
      return foundWords;
    }
}

const CMD = new Command();

const cmdTests = [
  "!entrega", "!retirada", "!aviso",
  "!bloqueia", "!desbloqueia", "!stats",
  "!status", "!restart", "9 1", "9 2", "9 3", "9 4",
  "9 993636362", "9 993636362 2", "9 993636362 1",
  "chaves", "pipoca", "1", "2", "3", "4", "0"
];

// Test the CMD class with each value in cmdTests
for (const test of cmdTests) {
  const result = CMD.check(test);
  if (typeof result === "object") {
    const { command, argument01, argument02 } = result;
    let output = `Input: "${test}", Command found: ${command}`;
    if (argument01 != null || argument01 != undefined) {
      output += `, Argument01: ${argument01}`;
    }
    if (argument02 != null || argument02 != undefined) {
      output += `, Argument02: ${argument02}`;
    }
    console.log(output);
  } else {
    console.log(result);
  }
}

const userInput = "Olá, gostaria de informações sobre o cardápio e horários.";
const foundMenuWords = CMD.checkBotMenuWordsInString(userInput);
if (foundMenuWords.length > 0) {
  console.log(`Palavras-chave do menu encontradas: ${foundMenuWords.join(", ")}`);
} else {
  console.log("Nenhuma palavra-chave do menu encontrada na entrada.");
}

// Bot Status
const used = process.memoryUsage();
const cpus = os.cpus().map(cpu => {
    cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
    return cpu;
});
const cpu = cpus.reduce((last, cpu, _, { length }) => {
    last.total += cpu.total;
    last.speed += cpu.speed / length;
    last.times.user += cpu.times.user;
    last.times.sys += cpu.times.sys;
    last.times.idle += cpu.times.idle;
    last.times.irq += cpu.times.irq;
    return last;
}, {
    speed: 0,
    total: 0,
    times: {
        user: 0,
        sys: 0,
        idle: 0,
        irq: 0
    }
});

// Descrição dos itens com emojis
console.log("ℹ️ Desempenho do CPU:");
console.log("🏁 Total de velocidade do CPU: " + cpu.speed);
console.log("📈 Tempo de CPU do usuário: " + formatTime(cpu.times.user));
console.log("🚦 Tempo de CPU do sistema: " + formatTime(cpu.times.sys));
console.log("💤 Tempo de CPU inativo: " + formatTime(cpu.times.idle));
console.log("⚡ Tempo de CPU 'irq': " + formatTime(cpu.times.irq));

console.log("ℹ️ Uso de Memória:");
console.log("📊 Uso de memória total: " + used.rss);
console.log("💼 Uso de memória de pilha: " + used.external);
console.log("📉 Uso de memória de heap total: " + used.heapTotal);
console.log("📈 Uso de memória de heap atual: " + used.heapUsed);

console.log("🖥️ Informações sobre CPUs:");
cpus.forEach((cpu, index) => {
    console.log(`CPU ${index + 1}:`);
    console.log(`🔶 Modelo: ${cpu.model}`);
    console.log(`🚀 Velocidade: ${cpu.speed}`);
    console.log(`🔥 Tempo do usuário: ` + formatTime(cpu.times.user));
    console.log(`⚙️ Tempo do sistema: ` + formatTime(cpu.times.sys));
    console.log(`💤 Tempo inativo: ` + formatTime(cpu.times.idle));
    console.log(`🔒 Tempo 'irq': ` + formatTime(cpu.times.irq));
});

var asciichart = require ('asciichart')
var s0 = new Array (120)
for (var i = 0; i < s0.length; i++)
    s0[i] = 15 * Math.sin (i * ((Math.PI * 4) / s0.length))
console.log (asciichart.plot (s0))

