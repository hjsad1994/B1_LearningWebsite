const questionCount = document.querySelector('#question-count');
const modeLabel = document.querySelector('#mode-label');
const statusText = document.querySelector('#status-text');
const quizTypeForm = document.querySelector('#quiz-type-form');
const modeForm = document.querySelector('#mode-form');
const quizForm = document.querySelector('#quiz-form');
const resultPanel = document.querySelector('#result-panel');
const questionTemplate = document.querySelector('#question-template');
const pageConfig = document.body ? document.body.dataset : {};
const modeFullTitle = document.querySelector('#mode-full-title');
const modeFullNote = document.querySelector('#mode-full-note');
const modeQuickInput = document.querySelector('#mode-quick');
const modeQuickTitle = document.querySelector('#mode-quick-title');
const modeQuickNote = document.querySelector('#mode-quick-note');

const sharedQuizConfigs = {
  english100: {
    quizId: 'english100',
    quickMode: 'random10',
    fullLabel: 'On het 100 cau',
    quickLabel: 'Luyen nhanh 10 cau',
    readyFull: 'San sang on toan bo 100 cau',
    readyQuick: 'San sang luyen nhanh 10 cau',
    fullNote: 'Lam toan bo de theo dung thu tu trong file goc.',
    quickNote: 'Lay ngau nhien 10 cau de on nhanh, van giu nguyen thu tu dap an.',
  },
  readingMixed: {
    quizId: 'readingMixed',
    quickMode: 'randomGroup',
    fullLabel: 'On het 20 cau',
    quickLabel: 'Random 1 bo reading',
    readyFull: 'San sang on toan bo 20 cau',
    readyQuick: 'San sang lam 1 bo reading ngau nhien',
    fullNote: 'Lam toan bo cac cau cua TEXT 1, 6, 11, 23 theo thu tu goc.',
    quickNote: 'Chon ngau nhien 1 text va lay tron bo 5 cau cua text do.',
  },
  signs40: {
    quizId: 'signs40',
    quickMode: 'random5',
    fullLabel: 'On het 40 cau',
    quickLabel: 'Luyen nhanh 5 cau',
    readyFull: 'San sang on toan bo 40 cau',
    readyQuick: 'San sang luyen nhanh 5 cau',
    fullNote: 'Lam toan bo bo de bien bao theo dung thu tu goc.',
    quickNote: 'Lay ngau nhien 5 cau de on gon nhung van giu nguyen dap an.',
  },
};

if (!questionCount || !modeLabel || !statusText || !modeForm || !quizForm || !resultPanel || !questionTemplate) {
  throw new Error('Quiz page is missing required elements.');
}

let currentQuestions = [];
let currentMode = 'full';

function getSelectedQuizId() {
  if (!quizTypeForm) {
    return pageConfig.quizId || 'english100';
  }

  const selected = quizTypeForm.querySelector('input[name="quiz-type"]:checked');
  return selected ? selected.value : 'english100';
}

function getQuizConfig() {
  const selectedQuizId = getSelectedQuizId();
  const sharedConfig = sharedQuizConfigs[selectedQuizId];

  if (sharedConfig) {
    return sharedConfig;
  }

  return {
    quizId: pageConfig.quizId,
    quickMode: pageConfig.quickMode || 'random10',
    fullLabel: pageConfig.fullLabel || 'On toan bo',
    quickLabel: pageConfig.quickLabel || 'Luyen nhanh',
    readyFull: pageConfig.readyFull || 'San sang lam bai',
    readyQuick: pageConfig.readyQuick || 'San sang luyen nhanh',
    fullNote: '',
    quickNote: '',
  };
}

function getModeText(mode, config = getQuizConfig()) {
  return mode === config.quickMode ? config.quickLabel : config.fullLabel;
}

function getSelectedMode() {
  const selected = modeForm.querySelector('input[name="study-mode"]:checked');
  return selected ? selected.value : 'full';
}

function syncModeCopy(config = getQuizConfig()) {
  if (modeFullTitle) {
    modeFullTitle.textContent = config.fullLabel;
  }

  if (modeFullNote) {
    modeFullNote.textContent = config.fullNote;
  }

  if (modeQuickInput) {
    modeQuickInput.value = config.quickMode;
  }

  if (modeQuickTitle) {
    modeQuickTitle.textContent = config.quickLabel;
  }

  if (modeQuickNote) {
    modeQuickNote.textContent = config.quickNote;
  }

  modeLabel.textContent = getModeText(getSelectedMode(), config);
}

function buildOption(questionId, key, value) {
  const label = document.createElement('label');
  label.className = 'option';

  const input = document.createElement('input');
  input.type = 'radio';
  input.name = `question-${questionId}`;
  input.value = key;

  const keySpan = document.createElement('span');
  keySpan.className = 'option-key';
  keySpan.textContent = `${key}.`;

  const textSpan = document.createElement('span');
  textSpan.textContent = value;

  label.append(input, keySpan, textSpan);
  return label;
}

function getQuestionPrompt(question) {
  const normalizedText = String(question.question || '').trim();
  return /^Cau\s+\d+$/i.test(normalizedText.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    ? 'Chon y nghia dung cua bien bao nay.'
    : normalizedText;
}

function renderQuestions(questions) {
  quizForm.innerHTML = '';

  questions.forEach((question) => {
    const fragment = questionTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.question-card');
    const number = fragment.querySelector('.question-number');
    const state = fragment.querySelector('.question-state');
    const text = fragment.querySelector('.question-text');
    const media = fragment.querySelector('.question-media');
    const image = fragment.querySelector('.question-image');
    const options = fragment.querySelector('.options');

    card.dataset.questionId = String(question.id);
    number.textContent = `Cau ${question.id}`;
    state.textContent = 'Chua tra loi';
    text.textContent = getQuestionPrompt(question);

    if (media && image && question.imageUrl) {
      image.src = question.imageUrl;
      image.alt = `Hinh minh hoa cho cau ${question.id}`;
      media.classList.remove('hidden');
    }

    Object.entries(question.options).forEach(([key, value]) => {
      options.appendChild(buildOption(question.id, key, value));
    });

    card.addEventListener('change', () => {
      state.textContent = 'Da chon dap an';
      card.classList.remove('unanswered');
    });

    quizForm.appendChild(fragment);
  });

  const submitRow = document.createElement('div');
  submitRow.className = 'submit-row';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Nop bai';

  submitRow.appendChild(submitButton);
  quizForm.appendChild(submitRow);
}

function collectAnswers() {
  return currentQuestions.reduce((accumulator, question) => {
    const selected = quizForm.querySelector(`input[name="question-${question.id}"]:checked`);
    if (selected) {
      accumulator[String(question.id)] = selected.value;
    }
    return accumulator;
  }, {});
}

function updateResults(payload) {
  const { score, total, unanswered, results } = payload;
  resultPanel.classList.remove('hidden');
  resultPanel.innerHTML = `
    <strong>Ban dung ${score}/${total} cau</strong>
    <p>Con ${unanswered} cau chua tra loi. Kiem tra tung cau ben duoi de xem dap an dung.</p>
  `;

  results.forEach((result) => {
    const card = quizForm.querySelector(`[data-question-id="${result.id}"]`);
    if (!card) {
      return;
    }

    const feedback = card.querySelector('.feedback');
    const state = card.querySelector('.question-state');

    card.classList.remove('correct', 'incorrect', 'unanswered');

    if (!result.userAnswer) {
      card.classList.add('unanswered');
      state.textContent = 'Bo trong';
      feedback.textContent = `Ban chua chon dap an. Dap an dung la ${result.correctAnswer}.`;
    } else if (result.isCorrect) {
      card.classList.add('correct');
      state.textContent = 'Dung';
      feedback.textContent = `Chinh xac. Ban da chon ${result.userAnswer}.`;
    } else {
      card.classList.add('incorrect');
      state.textContent = 'Sai';
      feedback.textContent = `Ban chon ${result.userAnswer}, dap an dung la ${result.correctAnswer}.`;
    }

    feedback.classList.remove('hidden');
  });
}

async function loadQuestions() {
  const config = getQuizConfig();
  currentMode = getSelectedMode();
  statusText.textContent = 'Dang tai de...';
  syncModeCopy(config);
  resultPanel.classList.add('hidden');
  resultPanel.innerHTML = '';

  const response = await fetch(
    `/api/quizzes/${encodeURIComponent(config.quizId)}/questions?mode=${encodeURIComponent(currentMode)}`,
  );
  if (!response.ok) {
    throw new Error('Khong the tai cau hoi');
  }

  const payload = await response.json();
  currentMode = payload.mode;
  currentQuestions = payload.questions;
  questionCount.textContent = String(payload.total);
  modeLabel.textContent = getModeText(payload.mode, config);
  statusText.textContent = payload.mode === config.quickMode ? config.readyQuick : config.readyFull;
  renderQuestions(currentQuestions);
}

function showLoadError(error) {
  statusText.textContent = 'Tai de that bai';
  resultPanel.classList.remove('hidden');
  resultPanel.innerHTML = `<strong>Khong the tai de</strong><p>${error.message}</p>`;
}

if (quizTypeForm) {
  quizTypeForm.addEventListener('change', () => {
    syncModeCopy();
    loadQuestions().catch(showLoadError);
  });
}

modeForm.addEventListener('change', () => {
  syncModeCopy();
  loadQuestions().catch(showLoadError);
});

quizForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = quizForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Dang cham bai...';
  }

  try {
    const config = getQuizConfig();
    const response = await fetch(`/api/quizzes/${encodeURIComponent(config.quizId)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionIds: currentQuestions.map((question) => question.id),
        answers: collectAnswers(),
      }),
    });

    if (!response.ok) {
      throw new Error('Nop bai khong thanh cong');
    }

    updateResults(await response.json());
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    resultPanel.classList.remove('hidden');
    resultPanel.innerHTML = `<strong>Co loi xay ra</strong><p>${error.message}</p>`;
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Nop bai';
    }
  }
});

syncModeCopy();
loadQuestions().catch(showLoadError);
