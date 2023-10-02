class Command {
  constructor() {
    this.version = '0.0.2';
    // List of specific commands with !
    this.specificCommands = ["!entrega", "!retirada", "!aviso", "!bloqueia", "!desbloqueia", "!stats", "!status", "!restart"];
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