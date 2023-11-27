# AutoAtende WhatsApp Bot
<br/>
<div align="center">
<a href="https://www.buymeacoffee.com/elsaud"><img src="https://img.buymeacoffee.com/button-api/?text=Support this project&emoji=&slug=skl11&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" /></a>
</div>
<br/>
## Table of Contents

- [Description](#description)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Description

AutoAtende is a WhatsApp bot developed in Node.js using the Baileys library. This bot is designed to automate tasks on WhatsApp, making it a useful tool for various purposes.

## Requirements

Before you can run the AutoAtende WhatsApp Bot, ensure you have the following dependencies installed:

- Node.js: [Download Node.js](https://nodejs.org/)
- MariaDB: [Download MariaDB](https://mariadb.org/)

## Installation

To install the AutoAtende WhatsApp Bot, follow these steps:

1. Clone this repository to your local machine:

   ```shell
   git clone https://github.com/lucassaud/autoatende.git
   ```

2. Change your working directory to the project folder:

   ```shell
   cd autoatende
   ```

3. Install the required Node.js packages using npm:

   ```shell
   npm install
   ```

4. Set up your MariaDB database. You may need to create a database, configure the connection settings in the `config.json` file, and run any necessary migrations.

5. Start the bot:

   ```shell
   npm start
   ```

The AutoAtende WhatsApp Bot should now be up and running.

## Usage

To use the bot, you can interact with it via WhatsApp. The bot can perform various tasks depending on its configuration and your specific use case.

## List of commands 

You can use the following commands in your WhatsApp conversations:

- **!delivery:** Notifies that the order is out for delivery.
  ```bash
  !entrega
  ```

  Example: Send `!entrega` to notify the customer that their order is out for delivery.

- **!pickup:** Notifies that the order is ready for pickup.
  ```bash
  !retirada
  ```

  Example: Send `!retirada` to inform the customer that their order is ready for pickup.

- **!block:** Adds the number to the exclusion list.
  ```bash
  !bloqueia
  ```

  Example: Send `!bloqueia` to add a number to the exclusion list.

- **!unblock:** Removes the number from the exclusion list.
  ```bash
  !desbloqueia
  ```

  Example: Send `!desbloqueia` to remove a number from the exclusion list.

- **!bot:** Notifies the use of the bot.
  ```bash
  !bot
  ```

  Example: Send `!bot` to receive information about the bot.

- **!backup:** Performs a database backup.
  ```bash
  !backup
  ```

  Example: Send `!backup` to initiate a backup of the database.

- **!status:** Checks the server status.
  ```bash
  !status
  ```

  Example: Send `!status` to get information about the server status.

- **!pix:** Receives the company's PIX key.
  ```bash
  !pix
  ```

  Example: Send `!pix` to receive the company's PIX key for payment.

- **!stats:** Gets statistics and reports.
  ```bash
  !stats
  ```

  Example: Send `!stats` to retrieve statistics and reports.

- **!hello:** Receives a greeting from the bot.
  ```bash
  !oi
  ```

  Example: Send `!oi` to receive a friendly greeting from the bot.

- **!welcome:** Receives welcome messages.
  ```bash
  !bv
  ```

  Example: Send `!bv` to receive welcome messages.

- **!menu:** Shows the menu.
  ```bash
  !cardapio
  ```

  Example: Send `!cardapio` to view the menu.

- **!address:** Shows the store's address.
  ```bash
  !endereco
  ```

  Example: Send `!endereco` to get the store's address.

- **!hours:** Shows the store's operating hours.
  ```bash
  !horario
  ```

  Example: Send `!horario` to check the store's operating hours.

# All commands can be changed by accessing the config.js file. To make alterations, please access the config.js file.

## Contributing

If you would like to contribute to this project, please follow these guidelines:

1. Fork the repository on GitHub.

2. Make your changes and commit them to your fork.

3. Submit a pull request to the main repository.

4. Your contributions will be reviewed and merged if they align with the project's goals.

## License

[Hippocratic + Do Not Harm Version 1.0](https://github.com/lucassaud/autoatende/blob/master/LICENSE.md)

## Legal

This code is in no way affiliated with, authorized, maintained, sponsored or endorsed by WA or any of its affiliates or subsidiaries. This is an independent and unofficial software. Use at your own risk.

## Author

- Author: Lucas Marinho Saud
- GitHub: [https://github.com/lucassaud](https://github.com/lucassaud)

## Cryptography Notice

This distribution includes cryptographic software. The country in which you currently reside may have restrictions on the import, possession, use, and/or re-export to another country, of encryption software. BEFORE using any encryption software, please check your country's laws, regulations and policies concerning the import, possession, or use, and re-export of encryption software, to see if this is permitted. See [http://www.wassenaar.org/](http://www.wassenaar.org/) for more information.

The U.S. Government Department of Commerce, Bureau of Industry and Security (BIS), has classified this software as Export Commodity Control Number (ECCN) 5D002.C.1, which includes information security software using or performing cryptographic functions with asymmetric algorithms. The form and manner of this distribution makes it eligible for export under the License Exception ENC Technology Software Unrestricted (TSU) exception (see the BIS Export Administration Regulations, Section 740.13) for both object code and source code.
