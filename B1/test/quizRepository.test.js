const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  createMixedExam,
  DEFAULT_CSV_PATH,
  DEFAULT_CLOZE_PATH,
  DEFAULT_LISTENING_PATH,
  DEFAULT_READING_PATH,
  DEFAULT_SIGN_PATH,
  DEFAULT_SPEAKING_TOPICS_PATH,
  DEFAULT_WRITING_TOPICS_PATH,
  QUIZ_TYPES,
  findQuestionsByIds,
  findMixedQuestionsByIds,
  getPublicQuestions,
  getQuizSet,
  groupQuestionsByText,
  loadClozeData,
  loadListeningData,
  loadQuizData,
  loadReadingData,
  loadSignData,
  loadSpeakingTopicsData,
  loadWritingTopicsData,
  normalizeQuizType,
  selectRandomItems,
  selectQuestions,
  scoreAnswers,
} = require('../lib/quizRepository');

test('loadQuizData parses all questions from CSV', () => {
  const questions = loadQuizData(DEFAULT_CSV_PATH);

  assert.equal(questions.length, 100);
  assert.deepEqual(questions[0], {
    id: 1,
    question: 'Tim ______ the news, while his son was playing computer games.',
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

test('selectQuestions returns a 10-question subset for random mode without changing option order', () => {
  const questions = loadQuizData(DEFAULT_CSV_PATH);
  const picks = [0.01, 0.2, 0.35, 0.49, 0.58, 0.67, 0.73, 0.81, 0.9, 0.99];
  let index = 0;
  const selected = selectQuestions(questions, 'random10', () => picks[index++], { quizType: QUIZ_TYPES.vocabulary });

  assert.equal(selected.length, 10);
  assert.deepEqual(
    selected.map((question) => question.id),
    [2, 21, 37, 51, 60, 69, 75, 83, 91, 100]
  );
  assert.deepEqual(Object.keys(selected[0].options), ['A', 'B', 'C', 'D']);
});

test('selectQuestions returns one full reading text for reading random mode', () => {
  const questions = loadReadingData(DEFAULT_READING_PATH);
  const selected = selectQuestions(questions, 'random10', () => 0.99, { quizType: QUIZ_TYPES.reading });

  assert.equal(selected.length, 5);
  assert.deepEqual(selected.map((question) => question.textCode), Array(5).fill('TEXT 23'));
  assert.deepEqual(selected.map((question) => question.questionNumber), [1, 2, 3, 4, 5]);
});

test('findQuestionsByIds returns only requested questions in request order', () => {
  const questions = loadQuizData(DEFAULT_CSV_PATH);
  const selected = findQuestionsByIds(questions, [10, 2, 75]);

  assert.deepEqual(selected.map((question) => question.id), [10, 2, 75]);
});

test('selectRandomItems keeps original order of selected items', () => {
  const selected = selectRandomItems(['A', 'B', 'C', 'D', 'E'], 3, (() => {
    const picks = [0.95, 0.1, 0.4];
    let index = 0;
    return () => picks[index++];
  })());

  assert.deepEqual(selected, ['A', 'C', 'E']);
});

test('loadSignData parses the sign dataset with image URLs', () => {
  const questions = loadSignData(DEFAULT_SIGN_PATH);

  assert.equal(questions.length, 40);
  assert.equal(questions[0].imageUrl, '/sign/01.png');
  assert.equal(questions[39].imageUrl, '/sign/40.png');
  assert.equal(questions[0].correctAnswer, 'B');
});

test('getQuizSet returns sign questions when quizType is sign', () => {
  const quizSet = getQuizSet({ quizType: QUIZ_TYPES.sign, signPath: DEFAULT_SIGN_PATH });

  assert.equal(quizSet.quizType, 'sign');
  assert.equal(quizSet.title, 'Sign');
  assert.equal(quizSet.questions.length, 40);
  assert.equal(quizSet.questions[0].imageUrl, '/sign/01.png');
});

test('normalizeQuizType defaults unknown values to vocabulary', () => {
  assert.equal(normalizeQuizType('cloze'), 'cloze');
  assert.equal(normalizeQuizType('listening'), 'listening');
  assert.equal(normalizeQuizType('sign'), 'sign');
  assert.equal(normalizeQuizType('reading'), 'reading');
  assert.equal(normalizeQuizType('vocabulary'), 'vocabulary');
  assert.equal(normalizeQuizType('abc'), 'vocabulary');
  assert.equal(normalizeQuizType(undefined), 'vocabulary');
});

test('loadClozeData parses the cloze dataset with text metadata', () => {
  const questions = loadClozeData(DEFAULT_CLOZE_PATH);

  assert.equal(questions.length, 40);
  assert.equal(questions[0].textCode, 'TEXT 4');
  assert.equal(questions[0].textTitle, 'HENRY FORD');
  assert.match(questions[0].passageBody, /\[1\]/);
  assert.equal(questions[39].correctAnswer, 'A');
});

test('loadClozeData reads from the provided custom path', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'clozeFixture.json');
  const questions = loadClozeData(fixturePath);

  assert.equal(questions.length, 1);
  assert.equal(questions[0].id, 901);
  assert.equal(questions[0].textCode, 'TEXT Z');
  assert.equal(questions[0].correctAnswer, 'B');
});

test('loadReadingData parses the reading dataset with text metadata', () => {
  const questions = loadReadingData(DEFAULT_READING_PATH);

  assert.equal(questions.length, 20);
  assert.equal(questions[0].textCode, 'TEXT 1');
  assert.equal(questions[0].textTitle, 'OUR GREAT OCEAN ROAD ADVENTURE');
  assert.equal(questions[0].passageBody, null);
  assert.equal(questions[19].correctAnswer, 'D');
});

test('loadReadingData reads from the provided custom path', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'readingFixture.json');
  const questions = loadReadingData(fixturePath);

  assert.equal(questions.length, 1);
  assert.equal(questions[0].id, 501);
  assert.equal(questions[0].textCode, 'TEXT X');
  assert.equal(questions[0].passageBody, 'Fixture passage body.');
  assert.equal(questions[0].correctAnswer, 'C');
});

test('getQuizSet returns reading questions when quizType is reading', () => {
  const quizSet = getQuizSet({ quizType: QUIZ_TYPES.reading, readingPath: DEFAULT_READING_PATH });

  assert.equal(quizSet.quizType, 'reading');
  assert.equal(quizSet.title, 'Reading Comprehension');
  assert.equal(quizSet.questions.length, 20);
  assert.equal(quizSet.questions[0].textCode, 'TEXT 1');
});

test('getQuizSet returns cloze questions when quizType is cloze', () => {
  const quizSet = getQuizSet({ quizType: QUIZ_TYPES.cloze, clozePath: DEFAULT_CLOZE_PATH });

  assert.equal(quizSet.quizType, 'cloze');
  assert.equal(quizSet.title, 'Cloze Text');
  assert.equal(quizSet.questions.length, 40);
  assert.equal(quizSet.questions[0].textCode, 'TEXT 4');
});

test('loadListeningData parses the listening dataset with format metadata', () => {
  const questions = loadListeningData(DEFAULT_LISTENING_PATH);

  assert.equal(questions.length, 70);
  assert.equal(questions[0].textCode, 'TEXT 27');
  assert.equal(questions[0].format, 'fill');
  assert.equal(questions[0].options, null);
  assert.equal(questions[0].correctAnswer, 'PROFESSIONAL');
  assert.equal(questions[30].format, 'mcq');
  assert.equal(questions[45].format, 'tf');
});

test('loadListeningData reads from the provided custom path', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'listeningFixture.json');
  const questions = loadListeningData(fixturePath);

  assert.equal(questions.length, 1);
  assert.equal(questions[0].id, 801);
  assert.equal(questions[0].format, 'fill');
  assert.equal(questions[0].correctAnswer, 'HELLO');
});

test('getQuizSet returns listening questions when quizType is listening', () => {
  const quizSet = getQuizSet({ quizType: QUIZ_TYPES.listening, listeningPath: DEFAULT_LISTENING_PATH });

  assert.equal(quizSet.quizType, 'listening');
  assert.equal(quizSet.title, 'Listening');
  assert.equal(quizSet.questions.length, 70);
  assert.equal(quizSet.questions[0].textCode, 'TEXT 27');
});

test('loadSpeakingTopicsData parses speaking prompts', () => {
  const topics = loadSpeakingTopicsData(DEFAULT_SPEAKING_TOPICS_PATH);

  assert.equal(topics.length, 6);
  assert.equal(topics[0].topicCode, 'Topic 9');
  assert.equal(topics[0].questions.length, 4);
});

test('loadWritingTopicsData parses writing prompts', () => {
  const topics = loadWritingTopicsData(DEFAULT_WRITING_TOPICS_PATH);

  assert.equal(topics.length, 2);
  assert.equal(topics[0].topicCode, 'Topic 15');
  assert.equal(topics[0].requirements.length, 4);
});

test('groupQuestionsByText groups consecutive text-based questions', () => {
  const groups = groupQuestionsByText(loadReadingData(DEFAULT_READING_PATH), 'READING');

  assert.equal(groups.length, 4);
  assert.equal(groups[0].textCode, 'TEXT 1');
  assert.equal(groups[0].questions.length, 5);
  assert.equal(groups[3].textCode, 'TEXT 23');
});

test('createMixedExam builds the requested section mix without answer keys', () => {
  const quizSets = {
    vocabulary: getQuizSet({ quizType: QUIZ_TYPES.vocabulary, csvPath: DEFAULT_CSV_PATH }),
    sign: getQuizSet({ quizType: QUIZ_TYPES.sign, signPath: DEFAULT_SIGN_PATH }),
    reading: getQuizSet({ quizType: QUIZ_TYPES.reading, readingPath: DEFAULT_READING_PATH }),
    cloze: getQuizSet({ quizType: QUIZ_TYPES.cloze, clozePath: DEFAULT_CLOZE_PATH }),
    listening: getQuizSet({ quizType: QUIZ_TYPES.listening, listeningPath: DEFAULT_LISTENING_PATH }),
    speakingTopics: loadSpeakingTopicsData(DEFAULT_SPEAKING_TOPICS_PATH),
    writingTopics: loadWritingTopicsData(DEFAULT_WRITING_TOPICS_PATH),
  };
  const mixedExam = createMixedExam(quizSets, () => 0);

  assert.equal(mixedExam.quizType, 'mixed');
  assert.equal(mixedExam.sections.length, 7);
  assert.equal(mixedExam.sections[0].questionCount, 10);
  assert.equal(mixedExam.sections[1].questionCount, 5);
  assert.equal(mixedExam.sections[2].groupCount, 1);
  assert.equal(mixedExam.sections[2].questionCount, 5);
  assert.equal(mixedExam.sections[3].groupCount, 1);
  assert.equal(mixedExam.sections[3].questionCount, 10);
  assert.equal(mixedExam.sections[4].groupCount, 2);
  assert.equal(mixedExam.sections[4].questionCount, 20);
  assert.equal(mixedExam.sections[5].type, 'speaking');
  assert.equal(mixedExam.sections[5].responseType, 'textarea');
  assert.equal(mixedExam.sections[6].type, 'writing');
  assert.equal(mixedExam.sections[6].responseType, 'textarea');
  assert.equal(mixedExam.total, 50);
  assert.equal(mixedExam.subjectiveSectionCount, 2);
  assert.equal(Object.hasOwn(mixedExam.sections[0].questions[0], 'correctAnswer'), false);
  assert.equal(Object.hasOwn(mixedExam.sections[2].groups[0].questions[0], 'correctAnswer'), false);
  assert.match(mixedExam.sections[0].questions[0].id, /^vocabulary:/);
  assert.match(mixedExam.sections[4].groups[0].questions[0].id, /^listening:/);
});

test('findMixedQuestionsByIds resolves composite question identifiers', () => {
  const quizSets = {
    vocabulary: getQuizSet({ quizType: QUIZ_TYPES.vocabulary, csvPath: DEFAULT_CSV_PATH }),
    sign: getQuizSet({ quizType: QUIZ_TYPES.sign, signPath: DEFAULT_SIGN_PATH }),
    reading: getQuizSet({ quizType: QUIZ_TYPES.reading, readingPath: DEFAULT_READING_PATH }),
    cloze: getQuizSet({ quizType: QUIZ_TYPES.cloze, clozePath: DEFAULT_CLOZE_PATH }),
    listening: getQuizSet({ quizType: QUIZ_TYPES.listening, listeningPath: DEFAULT_LISTENING_PATH }),
    speakingTopics: loadSpeakingTopicsData(DEFAULT_SPEAKING_TOPICS_PATH),
    writingTopics: loadWritingTopicsData(DEFAULT_WRITING_TOPICS_PATH),
  };
  const selected = findMixedQuestionsByIds(quizSets, ['sign:1', 'reading:1', 'listening:1']);

  assert.deepEqual(selected.map((question) => question.id), ['sign:1', 'reading:1', 'listening:1']);
  assert.equal(selected[0].correctAnswer, 'B');
  assert.equal(selected[1].correctAnswer, 'D');
  assert.equal(selected[2].correctAnswer, 'PROFESSIONAL');
});
