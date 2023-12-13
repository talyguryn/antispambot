const natural = require('natural');
const math = require('mathjs');

function detectSpam(testMessage, spamMessages, similarityThreshold = 0.6) {
  // Создание векторизатора TF-IDF
  const tfidfVectorizer = new natural.TfIdf();

  // Добавление данных для обучения векторизатора
  spamMessages.forEach(message => tfidfVectorizer.addDocument(message));

  // Векторизация тестового сообщения
  tfidfVectorizer.addDocument(testMessage);

  // Получение векторов для обучающих данных и тестового сообщения
  const vectors = [];
  for (let i = 0; i < spamMessages.length + 1; i++) {
    const vector = {};
    tfidfVectorizer.listTerms(i).forEach(term => vector[term.term] = term.tfidf);
    vectors.push(vector);
  }

  // Индексы векторов спам-сообщений в массиве
  const spamIndices = Array.from({ length: vectors.length - 1 }, (_, i) => i);

  // Рассчет косинусного сходства с обучающими данными
  const similarities = vectors.map((vector, index) => {
    if (index === vectors.length - 1) return 0;  // Игнорируем последний вектор (тестовое сообщение)

    const terms = [...new Set([...Object.keys(vector), ...Object.keys(vectors[vectors.length - 1])])];
    const dotProduct = terms.reduce((acc, term) => acc + (vector[term] || 0) * (vectors[vectors.length - 1][term] || 0), 0);
    const magnitudeA = math.sqrt(terms.reduce((acc, term) => acc + (vector[term] || 0) ** 2, 0));
    const magnitudeB = math.sqrt(terms.reduce((acc, term) => acc + (vectors[vectors.length - 1][term] || 0) ** 2, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  });

  // Функция для определения, считать ли сообщение спамом
  const isSpam = spamIndices.some(index => similarities[index] >= similarityThreshold);

  // get max similarity
  const maxSimilarity = Math.max(...similarities);

  if (isSpam) {
    console.log(`${(maxSimilarity).toFixed(2)}: ${testMessage}`);
  }

  return isSpam;
}

module.exports = detectSpam;
