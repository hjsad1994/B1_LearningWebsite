const test = require('node:test');
const assert = require('node:assert/strict');
const listeningQuizData = require('../data/listeningQuiz.json');

test('listening quiz data contains 70 questions across 9 texts', () => {
  assert.equal(listeningQuizData.length, 70);

  const ids = new Set();
  const textCodes = new Map();

  listeningQuizData.forEach((item) => {
    ids.add(item.id);
    textCodes.set(item.textCode, (textCodes.get(item.textCode) || 0) + 1);
    assert.equal(typeof item.textTitle, 'string');
    assert.equal(item.textTitle.length > 0, true);
    assert.match(item.format, /^(fill|mcq|tf)$/);
    assert.equal(typeof item.correctAnswer, 'string');
    assert.equal(item.correctAnswer.length > 0, true);
  });

  assert.equal(ids.size, 70);
  assert.equal(textCodes.size, 11);
});

test('listening quiz data has correct formats per text group', () => {
  const formatMap = new Map();
  listeningQuizData.forEach((item) => {
    formatMap.set(item.textCode, item.format);
  });

  assert.equal(formatMap.get('TEXT 27'), 'fill');
  assert.equal(formatMap.get('TEXT 28'), 'fill');
  assert.equal(formatMap.get('TEXT 29'), 'fill');
  assert.equal(formatMap.get('TEXT 32'), 'mcq');
  assert.equal(formatMap.get('TEXT 49'), 'mcq');
  assert.equal(formatMap.get('TEXT 50'), 'mcq');
  assert.equal(formatMap.get('TEXT 51'), 'tf');
  assert.equal(formatMap.get('TEXT 53'), 'tf');
  assert.equal(formatMap.get('TEXT 68'), 'tf');
  assert.equal(formatMap.get('TEXT 69'), 'tf');
  assert.equal(formatMap.get('TEXT 70'), 'tf');
});

test('listening quiz data keeps expected answer key samples', () => {
  const answerMap = new Map(listeningQuizData.map((item) => [item.id, item.correctAnswer]));

  assert.equal(answerMap.get(1), 'PROFESSIONAL');
  assert.equal(answerMap.get(11), 'SHANTYTOWN');
  assert.equal(answerMap.get(31), 'A');
  assert.equal(answerMap.get(46), 'FALSE');
  assert.equal(answerMap.get(66), 'TRUE');
});
