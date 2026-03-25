const path = require('node:path');
const express = require('express');
const {
  createMixedExam,
  DEFAULT_CSV_PATH,
  DEFAULT_CLOZE_PATH,
  DEFAULT_LISTENING_PATH,
  DEFAULT_READING_PATH,
  DEFAULT_SIGN_PATH,
  DEFAULT_SPEAKING_TOPICS_PATH,
  DEFAULT_WRITING_TOPICS_PATH,
  findMixedQuestionsByIds,
  findQuestionsByIds,
  getPublicQuestions,
  getQuizSet,
  loadSpeakingTopicsData,
  loadWritingTopicsData,
  normalizeQuizType,
  selectQuestions,
  scoreAnswers,
} = require('./lib/quizRepository');

function validateSubmissionPayload(res, answers, questionIds) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    res.status(400).json({ error: 'Dữ liệu trả lời không hợp lệ.' });
    return false;
  }

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    res.status(400).json({ error: 'Thiếu danh sách câu hỏi cần chấm.' });
    return false;
  }

  const uniqueQuestionIds = new Set(questionIds.map((id) => String(id)));
  if (uniqueQuestionIds.size !== questionIds.length) {
    res.status(400).json({ error: 'Danh sách câu hỏi bị trùng.' });
    return false;
  }

  return true;
}

function createApp(options = {}) {
  const publicPath = path.join(__dirname, 'public');
  const csvPath = options.csvPath || DEFAULT_CSV_PATH;
  const clozePath = options.clozePath || DEFAULT_CLOZE_PATH;
  const listeningPath = options.listeningPath || DEFAULT_LISTENING_PATH;
  const readingPath = options.readingPath || DEFAULT_READING_PATH;
  const signPath = options.signPath || DEFAULT_SIGN_PATH;
  const speakingTopicsPath = options.speakingTopicsPath || DEFAULT_SPEAKING_TOPICS_PATH;
  const writingTopicsPath = options.writingTopicsPath || DEFAULT_WRITING_TOPICS_PATH;
  const quizSets = {
    cloze: getQuizSet({ quizType: 'cloze', clozePath }),
    listening: getQuizSet({ quizType: 'listening', listeningPath }),
    vocabulary: getQuizSet({ quizType: 'vocabulary', csvPath }),
    reading: getQuizSet({ quizType: 'reading', readingPath }),
    sign: getQuizSet({ quizType: 'sign', signPath }),
    speakingTopics: loadSpeakingTopicsData(speakingTopicsPath),
    writingTopics: loadWritingTopicsData(writingTopicsPath),
  };
  const app = express();

  app.use(express.json());
  app.use(express.static(publicPath));
  app.use('/sign', express.static(signPath));

  app.get(['/speaking-topics', '/speaking-topics.html'], (req, res) => {
    res.sendFile(path.join(publicPath, 'speaking-topics.html'));
  });

  app.get(['/writing-topics', '/writing-topics.html'], (req, res) => {
    res.sendFile(path.join(publicPath, 'writing-topics.html'));
  });

  app.get(['/speaking', '/speaking.html'], (req, res) => {
    res.redirect('/speaking-topics.html');
  });

  app.get(['/writing', '/writing.html', '/wrting', '/wrting.html'], (req, res) => {
    res.redirect('/writing-topics.html');
  });

  app.get('/api/questions', (req, res) => {
    const requestedQuizType = req.query.quizType;
    if (requestedQuizType && (!quizSets[requestedQuizType] || !Array.isArray(quizSets[requestedQuizType].questions))) {
      res.status(400).json({ error: 'Loại bài không hợp lệ.' });
      return;
    }

    const quizType = normalizeQuizType(req.query.quizType);
    const mode = req.query.mode === 'random10' ? 'random10' : 'full';
    const quizSet = quizSets[quizType];
    const selectedQuestions = selectQuestions(quizSet.questions, mode, Math.random, { quizType });

    res.json({
      quizType,
      quizTitle: quizSet.title,
      mode,
      total: selectedQuestions.length,
      availableTotal: quizSet.questions.length,
      questions: getPublicQuestions(selectedQuestions),
    });
  });

  app.get('/api/mixed-exam', (req, res) => {
    res.json(createMixedExam(quizSets));
  });

  app.post('/api/submit', (req, res) => {
    const { quizType: requestedQuizType, answers, questionIds } = req.body || {};
    if (!requestedQuizType || !quizSets[requestedQuizType] || !Array.isArray(quizSets[requestedQuizType].questions)) {
      res.status(400).json({ error: 'Loại bài không hợp lệ.' });
      return;
    }

    if (!validateSubmissionPayload(res, answers, questionIds)) {
      return;
    }

    const selectedQuestions = findQuestionsByIds(quizSets[requestedQuizType].questions, questionIds);

    if (selectedQuestions.length !== questionIds.length) {
      res.status(400).json({ error: 'Danh sách câu hỏi không hợp lệ.' });
      return;
    }

    res.json(scoreAnswers(selectedQuestions, answers));
  });

  app.post('/api/mixed-exam/submit', (req, res) => {
    const { answers, questionIds } = req.body || {};

    if (!validateSubmissionPayload(res, answers, questionIds)) {
      return;
    }

    const selectedQuestions = findMixedQuestionsByIds(quizSets, questionIds);

    if (selectedQuestions.length !== questionIds.length) {
      res.status(400).json({ error: 'Danh sách câu hỏi không hợp lệ.' });
      return;
    }

    res.json(scoreAnswers(selectedQuestions, answers));
  });

  app.use((req, res) => {
    res.status(404).json({ error: `Không tìm thấy đường dẫn ${req.path}` });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, () => {
    console.log(`Ứng dụng trắc nghiệm đang chạy tại http://localhost:${port}`);
  });
}

module.exports = { createApp };
