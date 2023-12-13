const spamLibrary = require('./spam-library');
const preprocessText = require('./preprocess-text');

module.exports = () => {
  let spamExamples = spamLibrary.getAllMessages();

  // preprocess spam examples
  spamExamples = spamExamples.map(preprocessText)

  // remove empty strings
  spamExamples = spamExamples.filter(example => example);

  return spamExamples;
}