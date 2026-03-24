const test = require('node:test');
const assert = require('node:assert/strict');
const clozeQuizData = require('../data/clozeQuiz.json');

test('cloze quiz data contains 40 questions across 4 texts', () => {
  assert.equal(clozeQuizData.length, 40);

  const ids = new Set();
  const textCodes = new Map();

  clozeQuizData.forEach((item) => {
    ids.add(item.id);
    textCodes.set(item.textCode, (textCodes.get(item.textCode) || 0) + 1);
    assert.equal(typeof item.textTitle, 'string');
    assert.equal(item.textTitle.length > 0, true);
    assert.equal(typeof item.passageBody, 'string');
    assert.equal(item.passageBody.length > 0, true);
    assert.deepEqual(Object.keys(item.options), ['A', 'B', 'C', 'D']);
    assert.match(item.correctAnswer, /^[ABCD]$/);
  });

  assert.equal(ids.size, 40);
  assert.deepEqual([...textCodes.entries()], [
    ['TEXT 4', 10],
    ['TEXT 13', 10],
    ['TEXT 16', 10],
    ['TEXT 17', 10],
  ]);
});

test('cloze quiz data keeps expected answer key samples', () => {
  const answerMap = new Map(clozeQuizData.map((item) => [item.id, item.correctAnswer]));

  assert.equal(answerMap.get(1), 'C');
  assert.equal(answerMap.get(11), 'B');
  assert.equal(answerMap.get(21), 'A');
  assert.equal(answerMap.get(31), 'C');
  assert.equal(answerMap.get(40), 'A');
});
