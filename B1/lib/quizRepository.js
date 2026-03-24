const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('csv-parse/sync');
const signQuizData = require('../data/signQuiz.json');
const clozeQuizData = require('../data/clozeQuiz.json');

const DEFAULT_CSV_PATH = path.join(__dirname, '..', 'HUTECH_trac_nghiem_1_100.csv');
const DEFAULT_SIGN_PATH = path.join(__dirname, '..', 'Sign');
const DEFAULT_READING_PATH = path.join(__dirname, '..', 'data', 'readingQuiz.json');
const DEFAULT_CLOZE_PATH = path.join(__dirname, '..', 'data', 'clozeQuiz.json');
const DEFAULT_LISTENING_PATH = path.join(__dirname, '..', 'data', 'listeningQuiz.json');
const DEFAULT_SPEAKING_TOPICS_PATH = path.join(__dirname, '..', 'data', 'speakingTopics.json');
const DEFAULT_WRITING_TOPICS_PATH = path.join(__dirname, '..', 'data', 'writingTopics.json');
const QUIZ_TYPES = {
  vocabulary: 'vocabulary',
  sign: 'sign',
  reading: 'reading',
  cloze: 'cloze',
  listening: 'listening',
};

function loadQuizData(csvPath = DEFAULT_CSV_PATH) {
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(rawCsv, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  });

  return rows.map((row, index) => ({
    id: index + 1,
    question: String(row.Cau_hoi || '').trim(),
    options: {
      A: String(row.Dap_an_A || '').trim(),
      B: String(row.Dap_an_B || '').trim(),
      C: String(row.Dap_an_C || '').trim(),
      D: String(row.Dap_an_D || '').trim(),
    },
    correctAnswer: String(row.Dap_an_dung || '').trim().toUpperCase(),
  }));
}

function loadSignData(signPath = DEFAULT_SIGN_PATH) {
  return signQuizData.map((item) => ({
    id: item.id,
    question: item.question,
    imageUrl: `/sign/${item.imageFile}`,
    options: { ...item.options },
    correctAnswer: item.correctAnswer,
  }));
}

function loadReadingData(readingPath = DEFAULT_READING_PATH) {
  const rawReadingQuizData = fs.readFileSync(readingPath, 'utf8');
  const parsedReadingQuizData = JSON.parse(rawReadingQuizData);

  return parsedReadingQuizData.map((item) => ({
    id: item.id,
    textCode: item.textCode,
    textTitle: item.textTitle,
    passageBody: item.passageBody,
    questionNumber: item.questionNumber,
    question: item.question,
    options: { ...item.options },
    correctAnswer: item.correctAnswer,
  }));
}

function loadClozeData(clozePath = DEFAULT_CLOZE_PATH) {
  const rawClozeQuizData = fs.readFileSync(clozePath, 'utf8');
  const parsedClozeQuizData = JSON.parse(rawClozeQuizData);

  return parsedClozeQuizData.map((item) => ({
    id: item.id,
    textCode: item.textCode,
    textTitle: item.textTitle,
    passageBody: item.passageBody,
    questionNumber: item.questionNumber,
    question: item.question,
    options: { ...item.options },
    correctAnswer: item.correctAnswer,
  }));
}

function loadListeningData(listeningPath = DEFAULT_LISTENING_PATH) {
  const rawListeningQuizData = fs.readFileSync(listeningPath, 'utf8');
  const parsedListeningQuizData = JSON.parse(rawListeningQuizData);

  return parsedListeningQuizData.map((item) => ({
    id: item.id,
    textCode: item.textCode,
    textTitle: item.textTitle,
    passageBody: item.passageBody,
    format: item.format,
    questionNumber: item.questionNumber,
    question: item.question,
    options: item.options ? { ...item.options } : null,
    correctAnswer: item.correctAnswer,
  }));
}

function loadSpeakingTopicsData(speakingTopicsPath = DEFAULT_SPEAKING_TOPICS_PATH) {
  const rawSpeakingTopics = fs.readFileSync(speakingTopicsPath, 'utf8');
  return JSON.parse(rawSpeakingTopics).map((item) => ({
    id: item.id,
    topicCode: item.topicCode,
    title: item.title,
    prompt: item.prompt,
    questions: Array.isArray(item.questions) ? [...item.questions] : [],
  }));
}

function loadWritingTopicsData(writingTopicsPath = DEFAULT_WRITING_TOPICS_PATH) {
  const rawWritingTopics = fs.readFileSync(writingTopicsPath, 'utf8');
  return JSON.parse(rawWritingTopics).map((item) => ({
    id: item.id,
    topicCode: item.topicCode,
    title: item.title,
    prompt: item.prompt,
    requirements: Array.isArray(item.requirements) ? [...item.requirements] : [],
  }));
}

function normalizeQuizType(quizType) {
  if (quizType === QUIZ_TYPES.sign || quizType === QUIZ_TYPES.reading || quizType === QUIZ_TYPES.cloze || quizType === QUIZ_TYPES.listening) {
    return quizType;
  }

  return QUIZ_TYPES.vocabulary;
}

function getQuizSet(options = {}) {
  const quizType = normalizeQuizType(options.quizType);

  if (quizType === QUIZ_TYPES.sign) {
    return {
      quizType,
      title: 'Sign',
      questions: loadSignData(options.signPath),
    };
  }

  if (quizType === QUIZ_TYPES.reading) {
    return {
      quizType,
      title: 'Reading Comprehension',
      questions: loadReadingData(options.readingPath),
    };
  }

  if (quizType === QUIZ_TYPES.cloze) {
    return {
      quizType,
      title: 'Cloze Text',
      questions: loadClozeData(options.clozePath),
    };
  }

  if (quizType === QUIZ_TYPES.listening) {
    return {
      quizType,
      title: 'Listening',
      questions: loadListeningData(options.listeningPath),
    };
  }

  return {
    quizType,
    title: 'Vocabulary',
    questions: loadQuizData(options.csvPath),
  };
}

function getPublicQuestions(questions) {
  return questions.map(({ correctAnswer, ...publicQuestion }) => publicQuestion);
}

function selectRandomItems(items, targetCount, randomFn = Math.random) {
  const pool = items.map((item, index) => ({ item, index }));
  const selected = [];
  const safeTargetCount = Math.min(Math.max(targetCount, 0), pool.length);

  while (selected.length < safeTargetCount) {
    const index = Math.floor(randomFn() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected
    .sort((left, right) => left.index - right.index)
    .map(({ item }) => item);
}

function groupQuestionsByText(questions, fallbackPrefix = 'GROUP') {
  const groups = [];
  const groupMap = new Map();

  questions.forEach((question, index) => {
    const key = question.textCode || `${fallbackPrefix}-${index + 1}`;

    if (!groupMap.has(key)) {
      const group = {
        key,
        textCode: question.textCode || key,
        textTitle: question.textTitle || null,
        passageBody: question.passageBody || null,
        format: question.format || null,
        questions: [],
      };

      groupMap.set(key, group);
      groups.push(group);
    }

    groupMap.get(key).questions.push(question);
  });

  return groups;
}

function toMixedExamQuestion(question, quizType) {
  const { correctAnswer, ...publicQuestion } = question;

  return {
    ...publicQuestion,
    id: `${quizType}:${question.id}`,
    sourceId: question.id,
    quizType,
  };
}

function createMixedExam(quizSets, randomFn = Math.random) {
  const speakingTopics = quizSets.speakingTopics || [];
  const writingTopics = quizSets.writingTopics || [];
  const vocabularyQuestions = selectRandomItems(quizSets.vocabulary.questions, 10, randomFn)
    .map((question) => toMixedExamQuestion(question, QUIZ_TYPES.vocabulary));
  const signQuestions = selectRandomItems(quizSets.sign.questions, 5, randomFn)
    .map((question) => toMixedExamQuestion(question, QUIZ_TYPES.sign));
  const readingGroups = selectRandomItems(groupQuestionsByText(quizSets.reading.questions, 'READING'), 1, randomFn)
    .map((group) => ({
      ...group,
      questions: group.questions.map((question) => toMixedExamQuestion(question, QUIZ_TYPES.reading)),
    }));
  const clozeGroups = selectRandomItems(groupQuestionsByText(quizSets.cloze.questions, 'CLOZE'), 1, randomFn)
    .map((group) => ({
      ...group,
      questions: group.questions.map((question) => toMixedExamQuestion(question, QUIZ_TYPES.cloze)),
    }));
  const listeningGroups = selectRandomItems(groupQuestionsByText(quizSets.listening.questions, 'LISTENING'), 2, randomFn)
    .map((group) => ({
      ...group,
      questions: group.questions.map((question) => toMixedExamQuestion(question, QUIZ_TYPES.listening)),
    }));
  const speakingTopic = selectRandomItems(speakingTopics, 1, randomFn)[0] || null;
  const writingTopic = selectRandomItems(writingTopics, 1, randomFn)[0] || null;

  const sections = [
    {
      type: QUIZ_TYPES.vocabulary,
      title: quizSets.vocabulary.title,
      questionCount: vocabularyQuestions.length,
      questions: vocabularyQuestions,
    },
    {
      type: QUIZ_TYPES.sign,
      title: quizSets.sign.title,
      questionCount: signQuestions.length,
      questions: signQuestions,
    },
    {
      type: QUIZ_TYPES.reading,
      title: quizSets.reading.title,
      groupCount: readingGroups.length,
      questionCount: readingGroups.reduce((total, group) => total + group.questions.length, 0),
      groups: readingGroups,
    },
    {
      type: QUIZ_TYPES.cloze,
      title: quizSets.cloze.title,
      groupCount: clozeGroups.length,
      questionCount: clozeGroups.reduce((total, group) => total + group.questions.length, 0),
      groups: clozeGroups,
    },
    {
      type: QUIZ_TYPES.listening,
      title: quizSets.listening.title,
      groupCount: listeningGroups.length,
      questionCount: listeningGroups.reduce((total, group) => total + group.questions.length, 0),
      groups: listeningGroups,
    },
  ];

  if (speakingTopic) {
    sections.push({
      type: 'speaking',
      title: 'Speaking',
      questionCount: 0,
      responseType: 'textarea',
      topic: speakingTopic,
    });
  }

  if (writingTopic) {
    sections.push({
      type: 'writing',
      title: 'Writing',
      questionCount: 0,
      responseType: 'textarea',
      topic: writingTopic,
    });
  }

  return {
    quizType: 'mixed',
    quizTitle: 'Mixed Exam',
    total: sections.reduce((total, section) => total + (section.questionCount || 0), 0),
    subjectiveSectionCount: sections.filter((section) => section.responseType === 'textarea').length,
    sections,
  };
}

function findMixedQuestionsByIds(quizSets, questionIds = []) {
  const lookup = new Map();

  Object.entries(quizSets).forEach(([quizType, quizSet]) => {
    if (!quizSet || !Array.isArray(quizSet.questions)) {
      return;
    }

    quizSet.questions.forEach((question) => {
      lookup.set(`${quizType}:${question.id}`, {
        ...question,
        id: `${quizType}:${question.id}`,
        sourceId: question.id,
        quizType,
      });
    });
  });

  return questionIds
    .map((id) => lookup.get(String(id)))
    .filter(Boolean);
}

function selectQuestions(questions, mode = 'full', randomFn = Math.random, options = {}) {
  if (mode !== 'random10') {
    return questions;
  }

  if (options.quizType === QUIZ_TYPES.reading) {
    const selectedGroup = selectRandomItems(groupQuestionsByText(questions, 'READING'), 1, randomFn)[0];
    return selectedGroup ? selectedGroup.questions : [];
  }

  return selectRandomItems(questions, 10, randomFn);
}

function findQuestionsByIds(questions, questionIds = []) {
  const lookup = new Map(questions.map((question) => [String(question.id), question]));

  return questionIds
    .map((id) => lookup.get(String(id)))
    .filter(Boolean);
}

function scoreAnswers(questions, submittedAnswers = {}) {
  const results = questions.map((question) => {
    const userAnswer = String(submittedAnswers[String(question.id)] || '').trim().toUpperCase();
    const isCorrect = userAnswer !== '' && userAnswer === question.correctAnswer;

    return {
      id: question.id,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
    };
  });

  return {
    score: results.filter((item) => item.isCorrect).length,
    total: questions.length,
    unanswered: results.filter((item) => item.userAnswer === '').length,
    results,
  };
}

module.exports = {
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
  groupQuestionsByText,
  createMixedExam,
  getPublicQuestions,
  getQuizSet,
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
};
