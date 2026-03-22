const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('csv-parse/sync');

const GENERAL_CSV_PATH = path.join(__dirname, '..', 'HUTECH_trac_nghiem_1_100.csv');
const READING_CSV_PATH = path.join(__dirname, '..', 'HUTECH_reading_TEXT_1_6_11_23_updated.csv');
const SIGNS_CSV_PATH = path.join(__dirname, '..', 'HUTECH_trac_nghiem_Signs_1_40_filled.csv');
const DEFAULT_CSV_PATH = GENERAL_CSV_PATH;

function getQuestionGroup(questionText = '') {
  const match = /^\s*(TEXT\s+\d+)\s*-/i.exec(String(questionText).trim());
  return match ? match[1].toUpperCase() : null;
}

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
    group: getQuestionGroup(row.Cau_hoi),
    options: {
      A: String(row.Dap_an_A || '').trim(),
      B: String(row.Dap_an_B || '').trim(),
      C: String(row.Dap_an_C || '').trim(),
      D: String(row.Dap_an_D || '').trim(),
    },
    correctAnswer: String(row.Dap_an_dung || '').trim().toUpperCase(),
  }));
}

function getPublicQuestions(questions) {
  return questions.map(({ id, question, options, group }) => ({ id, question, options, group }));
}

function selectQuestions(questions, mode = 'full', randomFn = Math.random) {
  const match = /^random(\d+)$/i.exec(String(mode));
  if (match) {
    const requestedCount = Number(match[1]);
    const pool = [...questions];
    const selected = [];
    const targetCount = Math.min(requestedCount, pool.length);

    while (selected.length < targetCount) {
      const index = Math.floor(randomFn() * pool.length);
      selected.push(pool.splice(index, 1)[0]);
    }

    return selected.sort((left, right) => left.id - right.id);
  }

  if (mode === 'randomGroup') {
    const groups = Array.from(new Set(questions.map((question) => question.group).filter(Boolean)));

    if (groups.length === 0) {
      return questions;
    }

    const selectedGroup = groups[Math.floor(randomFn() * groups.length)];
    return questions.filter((question) => question.group === selectedGroup);
  }

  return questions;
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
  GENERAL_CSV_PATH,
  READING_CSV_PATH,
  SIGNS_CSV_PATH,
  findQuestionsByIds,
  getQuestionGroup,
  getPublicQuestions,
  loadQuizData,
  selectQuestions,
  scoreAnswers,
};
