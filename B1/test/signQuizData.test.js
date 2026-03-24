const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const signQuizData = require('../data/signQuiz.json');

test('sign quiz data contains 40 mapped questions with answers and images', () => {
  assert.equal(signQuizData.length, 40);

  signQuizData.forEach((item, index) => {
    const expectedId = index + 1;
    const imageFile = `${String(expectedId).padStart(2, '0')}.png`;

    assert.equal(item.id, expectedId);
    assert.equal(item.imageFile, imageFile);
    assert.equal(item.question.length > 0, true);
    assert.deepEqual(Object.keys(item.options), ['A', 'B', 'C', 'D']);
    assert.match(item.correctAnswer, /^[ABCD]$/);
    assert.equal(
      fs.existsSync(path.join(__dirname, '..', 'Sign', imageFile)),
      true
    );
  });
});

test('sign quiz data keeps corrected answers for reviewed questions', () => {
  const answerMap = new Map(signQuizData.map((item) => [item.id, item.correctAnswer]));

  assert.equal(answerMap.get(7), 'D');
  assert.equal(answerMap.get(9), 'A');
  assert.equal(answerMap.get(13), 'D');
  assert.equal(answerMap.get(34), 'B');
});
