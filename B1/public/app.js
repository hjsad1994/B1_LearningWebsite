const questionCount = document.querySelector('#question-count');
const modeLabel = document.querySelector('#mode-label');
const statusText = document.querySelector('#status-text');
const quizTypeForm = document.querySelector('#quiz-type-form');
const modeForm = document.querySelector('#mode-form');
const modeFullTitle = document.querySelector('#mode-full-title');
const modeRandomTitle = document.querySelector('#mode-random10-title');
const modeRandomCopy = document.querySelector('#mode-random10-copy');
const quizForm = document.querySelector('#quiz-form');
const resultPanel = document.querySelector('#result-panel');
const questionTemplate = document.querySelector('#question-template');

const quizTypeMeta = {
  vocabulary: {
    label: 'Vocabulary',
    total: 100,
    readyStatus: 'Sẵn sàng làm bài từ vựng',
    randomStatus: 'Sẵn sàng ôn ngẫu nhiên từ vựng',
  },
  sign: {
    label: 'Sign',
    total: 40,
    readyStatus: 'Sẵn sàng làm bài biển báo',
    randomStatus: 'Sẵn sàng ôn ngẫu nhiên biển báo',
  },
  reading: {
    label: 'Reading Comprehension',
    total: 20,
    readyStatus: 'Sẵn sàng làm bài đọc hiểu',
    randomStatus: 'Sẵn sàng ôn ngẫu nhiên đọc hiểu',
  },
  cloze: {
    label: 'Cloze Text',
    total: 40,
    readyStatus: 'Sẵn sàng làm bài điền từ theo đoạn văn',
    randomStatus: 'Sẵn sàng ôn ngẫu nhiên điền từ theo đoạn văn',
  },
  listening: {
    label: 'Listening',
    total: 70,
    readyStatus: 'Sẵn sàng làm bài nghe hiểu',
    randomStatus: 'Sẵn sàng ôn ngẫu nhiên nghe hiểu',
  },
};

let currentQuestions = [];
let currentMode = 'full';
let currentQuizType = 'vocabulary';
let latestLoadRequestId = 0;
let currentAvailableTotal = quizTypeMeta.vocabulary.total;

function getQuizTypeConfig(quizType) {
  return quizTypeMeta[quizType] || quizTypeMeta.vocabulary;
}

function getModeText(mode, quizType) {
  if (mode === 'random10') {
    if (quizType === 'reading') {
      return 'Ngẫu nhiên 1 TEXT';
    }

    return 'Ngẫu nhiên 10 câu';
  }

  return `Ôn đủ ${currentAvailableTotal} câu`;
}

function getRandomModeCopy(quizType) {
  if (quizType === 'reading') {
    return {
      title: 'Ôn ngẫu nhiên 1 TEXT',
      description: 'Lấy ngẫu nhiên 1 bài đọc gồm 5 câu để ôn trọn bộ theo từng TEXT.',
    };
  }

  return {
    title: 'Ôn ngẫu nhiên 10 câu',
    description: 'Lấy ngẫu nhiên 10 câu để luyện nhanh, giữ nguyên vị trí đáp án.',
  };
}

function getSelectedMode() {
  const selected = modeForm.querySelector('input[name="study-mode"]:checked');
  return selected ? selected.value : 'full';
}

function getSelectedQuizType() {
  const selected = quizTypeForm.querySelector('input[name="quiz-type"]:checked');
  return selected ? selected.value : 'vocabulary';
}

function syncModeCopy(quizType) {
  const randomModeCopy = getRandomModeCopy(quizType);
  modeFullTitle.textContent = getModeText('full', quizType);
  modeLabel.textContent = getModeText(currentMode, quizType);
  modeRandomTitle.textContent = randomModeCopy.title;
  modeRandomCopy.textContent = randomModeCopy.description;
}

function isGroupedQuizType(quizType) {
  return quizType === 'reading' || quizType === 'cloze' || quizType === 'listening';
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

function buildMetaItem(label, value) {
  const item = document.createElement('p');
  item.className = 'meta-item';

  const itemLabel = document.createElement('strong');
  itemLabel.textContent = `${label}:`;

  const itemValue = document.createElement('span');
  itemValue.textContent = value;

  item.append(itemLabel, itemValue);
  return item;
}

function getReadingMeta(question) {
  if (!question.textCode && !question.textTitle && !question.questionNumber && question.passageBody == null) {
    return [];
  }

  const items = [];

  if (question.textCode) {
    items.push(buildMetaItem('Mã bài đọc', question.textCode));
  }

  if (question.textTitle) {
    items.push(buildMetaItem('Tiêu đề', question.textTitle));
  }

  if (question.questionNumber) {
    items.push(buildMetaItem('Câu số', String(question.questionNumber)));
  }

  items.push(
    buildMetaItem(
      'Đoạn văn',
      question.passageBody || 'Dữ liệu hiện chưa cung cấp nội dung đoạn văn.',
    ),
  );

  return items;
}

function groupTextQuestions(questions, quizType) {
  const groups = [];
  const groupMap = new Map();

  questions.forEach((question) => {
    const key = question.textCode || `${quizType}-${question.id}`;

    if (!groupMap.has(key)) {
      const group = {
        key,
        textCode: question.textCode,
        textTitle: question.textTitle,
        passageBody: question.passageBody,
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

function buildGroupedQuestion(question) {
  const item = document.createElement('section');
  item.className = 'reading-question';
  item.dataset.questionId = String(question.id);

  const top = document.createElement('div');
  top.className = 'question-top';

  const number = document.createElement('span');
  number.className = 'question-number';
  number.textContent = `Câu ${question.questionNumber || question.id}`;

  const state = document.createElement('span');
  state.className = 'question-state';
  state.textContent = 'Chưa trả lời';

  top.append(number, state);

  const text = document.createElement('h3');
  text.className = 'reading-question-text';
  text.textContent = question.question;

  const feedback = document.createElement('p');
  feedback.className = 'feedback hidden';

  item.append(top, text);

  if (question.format === 'fill') {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'fill-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'fill-input';
    input.name = `question-${question.id}`;
    input.placeholder = 'Nhập đáp án...';
    input.autocomplete = 'off';

    input.addEventListener('input', () => {
      item.classList.remove('correct', 'incorrect', 'unanswered');
      state.textContent = input.value.trim() ? 'Đã nhập đáp án' : 'Chưa trả lời';
      feedback.classList.add('hidden');
      feedback.textContent = '';
    });

    inputWrapper.appendChild(input);
    item.appendChild(inputWrapper);
  } else {
    const options = document.createElement('div');
    options.className = 'options';
    if (question.options) {
      Object.entries(question.options).forEach(([key, value]) => {
        options.appendChild(buildOption(question.id, key, value));
      });
    }
    item.appendChild(options);

    item.addEventListener('change', () => {
      item.classList.remove('correct', 'incorrect', 'unanswered');
      state.textContent = 'Đã chọn đáp án';
      feedback.classList.add('hidden');
      feedback.textContent = '';
    });
  }

  item.appendChild(feedback);
  return item;
}

function buildTextGroup(group, quizType) {
  const card = document.createElement('section');
  card.className = `reading-group reading-group--${quizType}`;

  const header = document.createElement('div');
  header.className = 'reading-group-header';

  const heading = document.createElement('div');
  heading.className = 'reading-group-heading';

  const code = document.createElement('p');
  code.className = 'reading-group-code';
  code.textContent = group.textCode || (quizType === 'cloze' ? 'TEXT' : quizType === 'listening' ? 'LISTENING' : 'READING');

  const title = document.createElement('h2');
  title.className = 'reading-group-title';
  title.textContent = group.textTitle || getQuizTypeConfig(quizType).label;

  heading.append(code, title);

  if (group.format && quizType === 'listening') {
    const formatLabels = { fill: 'Điền từ', mcq: 'Trắc nghiệm', tf: 'Đúng / Sai' };
    const badge = document.createElement('span');
    badge.className = 'format-badge';
    badge.textContent = formatLabels[group.format] || group.format;
    heading.appendChild(badge);
  }

  header.appendChild(heading);

  if (group.passageBody) {
    const notice = document.createElement('p');
    notice.className = 'reading-group-passage';
    notice.textContent = group.passageBody;
    header.appendChild(notice);
  }

  const questions = document.createElement('div');
  questions.className = 'reading-questions';
  group.questions.forEach((question) => {
    questions.appendChild(buildGroupedQuestion(question));
  });

  card.append(header, questions);
  return card;
}

function renderGroupedQuestions(questions, quizType) {
  quizForm.innerHTML = '';

  const groups = groupTextQuestions(questions, quizType);
  groups.forEach((group) => {
    quizForm.appendChild(buildTextGroup(group, quizType));
  });

  const submitRow = document.createElement('div');
  submitRow.className = 'submit-row';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Nộp bài';

  submitRow.appendChild(submitButton);
  quizForm.appendChild(submitRow);
}

function renderQuestions(questions) {
  if (isGroupedQuizType(currentQuizType)) {
    renderGroupedQuestions(questions, currentQuizType);
    return;
  }

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
    const feedback = fragment.querySelector('.feedback');

    card.dataset.questionId = String(question.id);
    number.textContent = `Câu ${question.id}`;
    state.textContent = 'Chưa trả lời';
    text.textContent = question.question;

  if (question.imageUrl) {
    card.classList.add('question-card--sign');
    image.src = question.imageUrl;
    image.alt = `Hình minh họa cho câu ${question.id}`;
    media.classList.remove('hidden');
  }

    Object.entries(question.options).forEach(([key, value]) => {
      options.appendChild(buildOption(question.id, key, value));
    });

    card.addEventListener('change', () => {
      card.classList.remove('correct', 'incorrect', 'unanswered');
      state.textContent = 'Đã chọn đáp án';
      feedback.classList.add('hidden');
      feedback.textContent = '';
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
    } else {
      const textInput = quizForm.querySelector(`input[type="text"][name="question-${question.id}"]`);
      if (textInput && textInput.value.trim()) {
        accumulator[String(question.id)] = textInput.value.trim();
      }
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
  const requestId = ++latestLoadRequestId;
  currentMode = getSelectedMode();
  currentQuizType = getSelectedQuizType();
  statusText.textContent = 'Đang tải đề...';
  syncModeCopy(currentQuizType);
  resultPanel.classList.add('hidden');
  resultPanel.innerHTML = '';

  const response = await fetch(
    `/api/questions?quizType=${encodeURIComponent(currentQuizType)}&mode=${encodeURIComponent(currentMode)}`,
  );
  if (!response.ok) {
    throw new Error('Không thể tải câu hỏi');
  }

  const payload = await response.json();
  if (requestId !== latestLoadRequestId) {
    return;
  }

  currentMode = payload.mode;
  currentQuizType = payload.quizType || currentQuizType;
  currentAvailableTotal = payload.availableTotal || getQuizTypeConfig(currentQuizType).total;
  currentQuestions = payload.questions;
  questionCount.textContent = String(payload.total);
  syncModeCopy(currentQuizType);
  statusText.textContent = payload.mode === 'random10'
    ? getQuizTypeConfig(currentQuizType).randomStatus
    : getQuizTypeConfig(currentQuizType).readyStatus;
  renderQuestions(currentQuestions);
}

function showLoadError(error) {
  if (latestLoadRequestId === 0) {
    return;
  }

  statusText.textContent = 'Tải đề thất bại';
  resultPanel.classList.remove('hidden');
  resultPanel.innerHTML = `<strong>Không thể tải đề</strong><p>${error.message}</p>`;
}

quizTypeForm.addEventListener('change', () => {
  syncModeCopy(getSelectedQuizType());
  loadQuestions().catch(showLoadError);
});

modeForm.addEventListener('change', () => {
  loadQuestions().catch(showLoadError);
});

quizForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = quizForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Đang chấm bài...';
  }

  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizType: currentQuizType,
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

syncModeCopy(currentQuizType);

loadQuestions().catch(showLoadError);
