module.exports = (text) => {
  // lowercase
  text = text.toLowerCase();

  // left only letters, cyrillic and numbers
  text = text.replace(/[^a-zа-яё0-9\s]/g, ' ');

  // remove extra spaces
  text = text.replace(/\s{2,}/g," ");

  // remove spaces from start and end
  text = text.trim();

  return text;
}