const fs = require('fs');
const path = require('path');

const pathToSpamData = path.join(__dirname, 'data', 'spam.txt');

class SpamLibrary {
  getAllMessages() {
    return fs.readFileSync(pathToSpamData, 'utf8').split('\n\n');
  }

  addMessage(text) {
    const spamMessages = this.getAllMessages();

    spamMessages.push(text);

    fs.writeFileSync(pathToSpamData, spamMessages.join('\n\n'));
  }
}

module.exports = new SpamLibrary();