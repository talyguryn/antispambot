const detectSpam = require('./spam-detector');
const preprocessText = require('./preprocess-text');
const getSpamMessages = require('./get-spam-messages');

module.exports = (msg) => {
  if (!msg.text) return false;

  const text = preprocessText(msg.text);
  if (!text) return false;

  return detectSpam(text, getSpamMessages(), 0.5);;
}