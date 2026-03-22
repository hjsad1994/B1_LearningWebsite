const path = require('node:path');
const express = require('express');
const {
  findQuestionsByIds,
  GENERAL_CSV_PATH,
  getPublicQuestions,
  loadQuizData,
  READING_CSV_PATH,
  selectQuestions,
  SIGNS_CSV_PATH,
  scoreAnswers,
} = require('./lib/quizRepository');

const QUIZ_DEFINITIONS = {
  english100: {
    id: 'english100',
    title: 'Bo de tieng Anh 100 cau',
    csvPath: GENERAL_CSV_PATH,
    quickMode: 'random10',
  },
  readingMixed: {
    id: 'readingMixed',
    title: 'Bo de Reading Text 1 6 11 23',
    csvPath: READING_CSV_PATH,
    quickMode: 'randomGroup',
  },
  signs40: {
    id: 'signs40',
    title: 'Bo de bien bao Signs 1-40',
    csvPath: SIGNS_CSV_PATH,
    quickMode: 'random5',
  },
};

function createApp(options = {}) {
  const app = express();
  const quizzes = new Map(
    Object.values(QUIZ_DEFINITIONS).map((definition) => {
      const csvPath = options[definition.id]?.csvPath || definition.csvPath;
      const questions = loadQuizData(csvPath);

      return [definition.id, { ...definition, questions }];
    })
  );

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/quizzes', (req, res) => {
    res.json({
      quizzes: Array.from(quizzes.values()).map(({ id, title, quickMode, questions }) => ({
        id,
        title,
        quickMode,
        total: questions.length,
      })),
    });
  });

  app.get('/api/quizzes/:quizId/questions', (req, res) => {
    const quiz = quizzes.get(req.params.quizId);
    if (!quiz) {
      res.status(404).json({ error: 'Không tìm thấy bộ đề.' });
      return;
    }

    const mode = req.query.mode === quiz.quickMode ? quiz.quickMode : 'full';
    const selectedQuestions = selectQuestions(quiz.questions, mode);

    res.json({
      quizId: quiz.id,
      mode,
      total: selectedQuestions.length,
      availableTotal: quiz.questions.length,
      questions: getPublicQuestions(selectedQuestions),
    });
  });

  app.post('/api/quizzes/:quizId/submit', (req, res) => {
    const quiz = quizzes.get(req.params.quizId);
    if (!quiz) {
      res.status(404).json({ error: 'Không tìm thấy bộ đề.' });
      return;
    }

    const { answers, questionIds } = req.body || {};

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      res.status(400).json({ error: 'Dữ liệu trả lời không hợp lệ.' });
      return;
    }

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      res.status(400).json({ error: 'Thiếu danh sách câu hỏi cần chấm.' });
      return;
    }

    const uniqueQuestionIds = new Set(questionIds.map((id) => String(id)));
    if (uniqueQuestionIds.size !== questionIds.length) {
      res.status(400).json({ error: 'Danh sách câu hỏi bị trùng.' });
      return;
    }

    const selectedQuestions = findQuestionsByIds(quiz.questions, questionIds);

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
