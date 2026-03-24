const test = require('node:test');
const assert = require('node:assert/strict');
const readingQuizData = require('../data/readingQuiz.json');

test('reading quiz data contains 20 questions across 4 text groups', () => {
  assert.equal(readingQuizData.length, 20);

  const ids = new Set();
  const textCodes = new Set();

  readingQuizData.forEach((item) => {
    ids.add(item.id);
    textCodes.add(item.textCode);
    assert.equal(typeof item.textTitle, 'string');
    assert.equal(item.textTitle.length > 0, true);
    assert.equal(item.passageBody, null);
    assert.deepEqual(Object.keys(item.options), ['A', 'B', 'C', 'D']);
    assert.match(item.correctAnswer, /^[ABCD]$/);
  });

  assert.equal(ids.size, 20);
  assert.deepEqual([...textCodes], ['TEXT 1', 'TEXT 6', 'TEXT 11', 'TEXT 23']);
});

test('reading quiz data keeps provided answer key', () => {
  const answerMap = new Map(readingQuizData.map((item) => [item.id, item.correctAnswer]));

  assert.equal(answerMap.get(1), 'D');
  assert.equal(answerMap.get(6), 'B');
  assert.equal(answerMap.get(11), 'B');
  assert.equal(answerMap.get(16), 'C');
  assert.equal(answerMap.get(20), 'D');
});
