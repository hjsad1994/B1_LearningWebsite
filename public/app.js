const questionCount = document.querySelector('#question-count');
const modeLabel = document.querySelector('#mode-label');
const statusText = document.querySelector('#status-text');
const modeForm = document.querySelector('#mode-form');
const quizForm = document.querySelector('#quiz-form');
const resultPanel = document.querySelector('#result-panel');
const questionTemplate = document.querySelector('#question-template');
const pageConfig = document.body.dataset;

let currentQuestions = [];
let currentMode = 'full';
const quizId = pageConfig.quizId;
const quickMode = pageConfig.quickMode || 'random10';
const fullLabel = pageConfig.fullLabel || 'Ôn toàn bộ';
const quickLabel = pageConfig.quickLabel || 'Luyện nhanh';
const readyFullText = pageConfig.readyFull || 'Sẵn sàng làm bài';
const readyQuickText = pageConfig.readyQuick || 'Sẵn sàng luyện nhanh';

function getModeText(mode) {
  return mode === quickMode ? quickLabel : fullLabel;
}

function getSelectedMode() {
  const selected = modeForm.querySelector('input[name="study-mode"]:checked');
  return selected ? selected.value : 'full';
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
    ? 'Chọn ý nghĩa đúng của biển báo này.'
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
    const options = fragment.querySelector('.options');

    card.dataset.questionId = String(question.id);
    number.textContent = `Câu ${question.id}`;
    state.textContent = 'Chưa trả lời';
    text.textContent = getQuestionPrompt(question);

    Object.entries(question.options).forEach(([key, value]) => {
      options.appendChild(buildOption(question.id, key, value));
    });

    card.addEventListener('change', () => {
      state.textContent = 'Đã chọn đáp án';
      card.classList.remove('unanswered');
    });

    quizForm.appendChild(fragment);
  });

  const submitRow = document.createElement('div');
  submitRow.className = 'submit-row';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Nộp bài';

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
    <strong>Bạn đúng ${score}/${total} câu</strong>
    <p>Còn ${unanswered} câu chưa trả lời. Kiểm tra từng câu bên dưới để xem đáp án đúng.</p>
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
      state.textContent = 'Bỏ trống';
      feedback.textContent = `Bạn chưa chọn đáp án. Đáp án đúng là ${result.correctAnswer}.`;
    } else if (result.isCorrect) {
      card.classList.add('correct');
      state.textContent = 'Đúng';
      feedback.textContent = `Chính xác. Bạn đã chọn ${result.userAnswer}.`;
    } else {
      card.classList.add('incorrect');
      state.textContent = 'Sai';
      feedback.textContent = `Bạn chọn ${result.userAnswer}, đáp án đúng là ${result.correctAnswer}.`;
    }

    feedback.classList.remove('hidden');
  });
}

async function loadQuestions() {
  currentMode = getSelectedMode();
  statusText.textContent = 'Đang tải đề...';
  modeLabel.textContent = getModeText(currentMode);
  resultPanel.classList.add('hidden');
  resultPanel.innerHTML = '';

  const response = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}/questions?mode=${encodeURIComponent(currentMode)}`);
  if (!response.ok) {
    throw new Error('Không thể tải câu hỏi');
  }

  const payload = await response.json();
  currentMode = payload.mode;
  currentQuestions = payload.questions;
  questionCount.textContent = String(payload.total);
  modeLabel.textContent = getModeText(payload.mode);
  statusText.textContent = payload.mode === quickMode ? readyQuickText : readyFullText;
  renderQuestions(currentQuestions);
}

modeForm.addEventListener('change', () => {
  loadQuestions().catch((error) => {
    statusText.textContent = 'Tải đề thất bại';
    resultPanel.classList.remove('hidden');
    resultPanel.innerHTML = `<strong>Không thể tải đề</strong><p>${error.message}</p>`;
  });
});

quizForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = quizForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Đang chấm bài...';
  }

  try {
    const response = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionIds: currentQuestions.map((question) => question.id),
        answers: collectAnswers(),
      }),
    });

    if (!response.ok) {
      throw new Error('Nộp bài không thành công');
    }

    updateResults(await response.json());
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    resultPanel.classList.remove('hidden');
    resultPanel.innerHTML = `<strong>Có lỗi xảy ra</strong><p>${error.message}</p>`;
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Nộp bài';
    }
  }
});

loadQuestions().catch((error) => {
  statusText.textContent = 'Tải đề thất bại';
  resultPanel.classList.remove('hidden');
  resultPanel.innerHTML = `<strong>Không thể tải đề</strong><p>${error.message}</p>`;
});
