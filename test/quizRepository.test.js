const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_CSV_PATH,
  findQuestionsByIds,
  GENERAL_CSV_PATH,
  getPublicQuestions,
  loadQuizData,
  READING_CSV_PATH,
  selectQuestions,
  SIGNS_CSV_PATH,
  scoreAnswers,
} = require('../lib/quizRepository');

test('loadQuizData parses all questions from CSV', () => {
  const questions = loadQuizData(DEFAULT_CSV_PATH);

  assert.equal(questions.length, 100);
  assert.deepEqual(questions[0], {
    id: 1,
    question: 'Tim ______ the news, while his son was playing computer games.',
    group: null,
    options: {
      A: 'is watching',
      B: 'watches',
      C: 'was watching',
      D: 'watching',
    },
    correctAnswer: 'C',
  });
  assert.equal(questions[99].correctAnswer, 'B');
});

test('loadQuizData parses the signs quiz CSV', () => {
  const questions = loadQuizData(SIGNS_CSV_PATH);

  assert.equal(questions.length, 40);
  assert.equal(questions[0].question, 'Câu 1');
  assert.equal(questions[0].correctAnswer, 'B');
  assert.equal(questions[39].correctAnswer, 'B');
});

test('loadQuizData parses the reading quiz CSV', () => {
  const questions = loadQuizData(READING_CSV_PATH);

  assert.equal(questions.length, 20);
  assert.equal(questions[0].question, 'TEXT 1 - Câu 1');
  assert.equal(questions[0].group, 'TEXT 1');
  assert.equal(questions[19].group, 'TEXT 23');
});

test('getPublicQuestions removes answer keys', () => {
  const publicQuestions = getPublicQuestions(loadQuizData(DEFAULT_CSV_PATH));

  assert.equal(publicQuestions.length, 100);
  assert.equal(Object.hasOwn(publicQuestions[0], 'correctAnswer'), false);
});

test('scoreAnswers counts correct and unanswered items', () => {
  const result = scoreAnswers(loadQuizData(DEFAULT_CSV_PATH), {
    '1': 'C',
    '2': 'D',
    '3': 'A',
  });

  assert.equal(result.score, 2);
  assert.equal(result.total, 100);
  assert.equal(result.unanswered, 97);
  assert.deepEqual(result.results[0], {
    id: 1,
    userAnswer: 'C',
    correctAnswer: 'C',
    isCorrect: true,
  });
});

test('selectQuestions returns a 10-question subset for random10 mode without changing option order', () => {
  const questions = loadQuizData(GENERAL_CSV_PATH);
  const picks = [0.01, 0.2, 0.35, 0.49, 0.58, 0.67, 0.73, 0.81, 0.9, 0.99];
  let index = 0;
  const selected = selectQuestions(questions, 'random10', () => picks[index++]);

  assert.equal(selected.length, 10);
  assert.deepEqual(
    selected.map((question) => question.id),
    [2, 21, 37, 51, 60, 69, 75, 83, 91, 100]
  );
  assert.deepEqual(Object.keys(selected[0].options), ['A', 'B', 'C', 'D']);
});

test('selectQuestions supports random5 mode for the signs quiz', () => {
  const questions = loadQuizData(SIGNS_CSV_PATH);
  const picks = [0.01, 0.26, 0.51, 0.76, 0.99];
  let index = 0;
  const selected = selectQuestions(questions, 'random5', () => picks[index++]);

  assert.equal(selected.length, 5);
  assert.deepEqual(
    selected.map((question) => question.id),
    [1, 12, 22, 32, 40]
  );
  assert.deepEqual(Object.keys(selected[0].options), ['A', 'B', 'C', 'D']);
});

test('selectQuestions supports randomGroup mode for the reading quiz', () => {
  const questions = loadQuizData(READING_CSV_PATH);
  const selected = selectQuestions(questions, 'randomGroup', () => 0.51);

  assert.equal(selected.length, 5);
  assert.deepEqual(selected.map((question) => question.id), [11, 12, 13, 14, 15]);
  assert.deepEqual([...new Set(selected.map((question) => question.group))], ['TEXT 11']);
});

test('findQuestionsByIds returns only requested questions in request order', () => {
  const questions = loadQuizData(DEFAULT_CSV_PATH);
  const selected = findQuestionsByIds(questions, [10, 2, 75]);

  assert.deepEqual(selected.map((question) => question.id), [10, 2, 75]);
});
