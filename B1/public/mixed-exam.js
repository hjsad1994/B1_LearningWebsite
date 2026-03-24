const questionCount = document.querySelector('#exam-question-count');
const statusText = document.querySelector('#exam-status-text');
const reloadButton = document.querySelector('#reload-exam-button');
const examForm = document.querySelector('#mixed-exam-form');
const resultPanel = document.querySelector('#mixed-result-panel');
const questionTemplate = document.querySelector('#question-template');

let currentQuestionIds = [];
let latestLoadRequestId = 0;

function buildPromptList(items, className) {
  const list = document.createElement('ul');
  list.className = className;

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    list.appendChild(listItem);
  });

  return list;
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

function buildSimpleQuestionCard(question) {
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
  number.textContent = `Câu ${question.sourceId}`;
  state.textContent = 'Chưa trả lời';
  text.textContent = question.question;

  if (question.imageUrl) {
    card.classList.add('question-card--sign');
    image.src = question.imageUrl;
    image.alt = `Hình minh họa cho câu ${question.sourceId}`;
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

  return fragment;
}

function buildGroupedQuestion(question) {
  const item = document.createElement('section');
  item.className = 'reading-question';
  item.dataset.questionId = String(question.id);

  const top = document.createElement('div');
  top.className = 'question-top';

  const number = document.createElement('span');
  number.className = 'question-number';
  number.textContent = `Câu ${question.questionNumber || question.sourceId}`;

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
  title.textContent = group.textTitle || group.textCode || 'Bài đọc';

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

function buildSectionMeta(section) {
  if (section.responseType === 'textarea') {
    return 'Tu nhap cau tra loi - khong cham tu dong';
  }

  if (section.groups) {
    return `${section.groupCount} bài - ${section.questionCount} câu`;
  }

  return `${section.questionCount} câu`;
}

function buildSubjectiveSection(section) {
  const wrapper = document.createElement('section');
  wrapper.className = 'exam-section subjective-section';

  const header = document.createElement('div');
  header.className = 'section-header';

  const heading = document.createElement('div');
  heading.className = 'section-heading';

  const badge = document.createElement('span');
  badge.className = 'quiz-badge';
  badge.textContent = section.type;

  const title = document.createElement('h2');
  title.textContent = section.title;

  const meta = document.createElement('p');
  meta.className = 'section-meta';
  meta.textContent = buildSectionMeta(section);

  heading.append(badge, title, meta);
  header.appendChild(heading);
  wrapper.appendChild(header);

  const topicCard = document.createElement('div');
  topicCard.className = 'subjective-card';

  const topicBadge = document.createElement('p');
  topicBadge.className = 'reading-group-code';
  topicBadge.textContent = section.topic.topicCode;

  const topicTitle = document.createElement('h3');
  topicTitle.className = 'subjective-title';
  topicTitle.textContent = section.topic.title;

  const prompt = document.createElement('p');
  prompt.className = 'subjective-brief';
  prompt.textContent = section.topic.prompt;

  topicCard.append(topicBadge, topicTitle, prompt);

  if (Array.isArray(section.topic.questions) && section.topic.questions.length > 0) {
    topicCard.appendChild(buildPromptList(section.topic.questions, 'subjective-list'));
  }

  if (Array.isArray(section.topic.requirements) && section.topic.requirements.length > 0) {
    topicCard.appendChild(buildPromptList(section.topic.requirements, 'subjective-list'));
  }

  const textarea = document.createElement('textarea');
  textarea.className = 'subjective-input';
  textarea.name = `${section.type}-${section.topic.id}`;
  textarea.rows = section.type === 'writing' ? 10 : 8;
  textarea.placeholder = section.type === 'writing'
    ? 'Nhap bai writing cua ban o day...'
    : 'Nhap y chinh hoac bai noi speaking cua ban o day...';

  const note = document.createElement('p');
  note.className = 'subjective-note';
  note.textContent = 'Phan nay de ban tu luyen va tu review, he thong hien chua cham diem tu dong.';

  topicCard.append(textarea, note);
  wrapper.appendChild(topicCard);

  return wrapper;
}

function buildSection(section) {
  if (section.responseType === 'textarea') {
    return buildSubjectiveSection(section);
  }

  const wrapper = document.createElement('section');
  wrapper.className = 'exam-section';

  const header = document.createElement('div');
  header.className = 'section-header';

  const heading = document.createElement('div');
  heading.className = 'section-heading';

  const badge = document.createElement('span');
  badge.className = 'quiz-badge';
  badge.textContent = section.type;

  const title = document.createElement('h2');
  title.textContent = section.title;

  const meta = document.createElement('p');
  meta.className = 'section-meta';
  meta.textContent = buildSectionMeta(section);

  heading.append(badge, title, meta);
  header.appendChild(heading);
  wrapper.appendChild(header);

  if (section.groups) {
    const list = document.createElement('div');
    list.className = 'exam-group-list';
    section.groups.forEach((group) => {
      list.appendChild(buildTextGroup(group, section.type));
    });
    wrapper.appendChild(list);
    return wrapper;
  }

  const list = document.createElement('div');
  list.className = 'section-question-list';
  section.questions.forEach((question) => {
    list.appendChild(buildSimpleQuestionCard(question));
  });
  wrapper.appendChild(list);

  return wrapper;
}

function collectAnswers() {
  return currentQuestionIds.reduce((answers, questionId) => {
    const selected = examForm.querySelector(`input[name="question-${questionId}"]:checked`);
    if (selected) {
      answers[String(questionId)] = selected.value;
      return answers;
    }

    const textInput = examForm.querySelector(`input[type="text"][name="question-${questionId}"]`);
    if (textInput && textInput.value.trim()) {
      answers[String(questionId)] = textInput.value.trim();
    }

    return answers;
  }, {});
}

function updateResults(payload) {
  const { score, total, unanswered, results } = payload;
  resultPanel.classList.remove('hidden');
  resultPanel.innerHTML = `
    <strong>Bạn đúng ${score}/${total} câu</strong>
    <p>Còn ${unanswered} câu chưa trả lời. Kéo xuống từng phần để xem đáp án đúng. Speaking và Writing chỉ để tự luyện nên không được chấm tự động.</p>
  `;

  results.forEach((result) => {
    const card = examForm.querySelector(`[data-question-id="${result.id}"]`);
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

function extractQuestionIds(sections) {
  return sections.flatMap((section) => {
    if (section.responseType === 'textarea') {
      return [];
    }

    if (section.groups) {
      return section.groups.flatMap((group) => group.questions.map((question) => String(question.id)));
    }

    return section.questions.map((question) => String(question.id));
  });
}

function renderExam(payload) {
  examForm.innerHTML = '';
  payload.sections.forEach((section) => {
    examForm.appendChild(buildSection(section));
  });

  const submitRow = document.createElement('div');
  submitRow.className = 'submit-row';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Nộp bài';

  submitRow.appendChild(submitButton);
  examForm.appendChild(submitRow);
}

async function loadExam() {
  const requestId = ++latestLoadRequestId;
  statusText.textContent = 'Đang tạo đề...';
  questionCount.textContent = '...';
  resultPanel.classList.add('hidden');
  resultPanel.innerHTML = '';
  examForm.innerHTML = '';

  const response = await fetch('/api/mixed-exam');
  if (!response.ok) {
    throw new Error('Không thể tạo đề tổng hợp');
  }

  const payload = await response.json();
  if (requestId !== latestLoadRequestId) {
    return;
  }

  currentQuestionIds = extractQuestionIds(payload.sections);
  questionCount.textContent = payload.subjectiveSectionCount
    ? `${payload.total} + ${payload.subjectiveSectionCount} phan tu luyen`
    : String(payload.total);
  statusText.textContent = 'Sẵn sàng làm đề';
  renderExam(payload);
}

function showLoadError(error) {
  if (latestLoadRequestId === 0) {
    return;
  }

  statusText.textContent = 'Tạo đề thất bại';
  resultPanel.classList.remove('hidden');
  resultPanel.innerHTML = `<strong>Không thể tạo đề</strong><p>${error.message}</p>`;
}

reloadButton.addEventListener('click', () => {
  loadExam().catch(showLoadError);
});

examForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = examForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Đang chấm bài...';
  }

  try {
    const response = await fetch('/api/mixed-exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionIds: currentQuestionIds,
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

loadExam().catch(showLoadError);
