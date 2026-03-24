const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../server');

function request(baseUrl, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, baseUrl);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body, headers: res.headers }));
      }
    );

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

test('GET /api/questions returns quiz payload without answers', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/questions');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizType, 'vocabulary');
    assert.equal(payload.quizTitle, 'Vocabulary');
    assert.equal(payload.mode, 'full');
    assert.equal(payload.total, 100);
    assert.equal(payload.questions.length, 100);
    assert.equal(Object.hasOwn(payload.questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/questions?mode=random10 returns a 10-question subset', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/questions?mode=random10');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.mode, 'random10');
    assert.equal(payload.total, 10);
    assert.equal(payload.availableTotal, 100);
    assert.equal(payload.questions.length, 10);
    assert.equal(Object.hasOwn(payload.questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/questions?quizType=sign returns sign quiz payload with image URLs', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/questions?quizType=sign');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizType, 'sign');
    assert.equal(payload.quizTitle, 'Sign');
    assert.equal(payload.total, 40);
    assert.equal(payload.availableTotal, 40);
    assert.equal(payload.questions[0].imageUrl, '/sign/01.png');
    assert.equal(Object.hasOwn(payload.questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/questions?quizType=reading returns reading quiz payload with text metadata', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/questions?quizType=reading');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizType, 'reading');
    assert.equal(payload.quizTitle, 'Reading Comprehension');
    assert.equal(payload.total, 20);
    assert.equal(payload.availableTotal, 20);
    assert.equal(payload.questions[0].textCode, 'TEXT 1');
    assert.equal(payload.questions[0].textTitle, 'OUR GREAT OCEAN ROAD ADVENTURE');
    assert.equal(payload.questions[0].passageBody, null);
    assert.equal(Object.hasOwn(payload.questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/questions?quizType=reading&mode=random10 returns one full reading text', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/questions?quizType=reading&mode=random10');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizType, 'reading');
    assert.equal(payload.mode, 'random10');
    assert.equal(payload.total, 5);
    assert.equal(payload.availableTotal, 20);
    assert.equal(new Set(payload.questions.map((question) => question.textCode)).size, 1);
    assert.deepEqual(payload.questions.map((question) => question.questionNumber), [1, 2, 3, 4, 5]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/questions?quizType=cloze returns cloze quiz payload with text metadata', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/questions?quizType=cloze');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizType, 'cloze');
    assert.equal(payload.quizTitle, 'Cloze Text');
    assert.equal(payload.total, 40);
    assert.equal(payload.availableTotal, 40);
    assert.equal(payload.questions[0].textCode, 'TEXT 4');
    assert.equal(payload.questions[0].textTitle, 'HENRY FORD');
    assert.match(payload.questions[0].passageBody, /\[1\]/);
    assert.equal(Object.hasOwn(payload.questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/questions?quizType=listening returns listening quiz payload with format metadata', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/questions?quizType=listening');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizType, 'listening');
    assert.equal(payload.quizTitle, 'Listening');
    assert.equal(payload.total, 70);
    assert.equal(payload.availableTotal, 70);
    assert.equal(payload.questions[0].textCode, 'TEXT 27');
    assert.equal(payload.questions[0].format, 'fill');
    assert.equal(payload.questions[0].options, null);
    assert.equal(Object.hasOwn(payload.questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/questions rejects invalid quiz types', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/questions?quizType=abc');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 400);
    assert.match(payload.error, /Loại bài không hợp lệ/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/mixed-exam returns the requested mixed exam structure', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/mixed-exam');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizType, 'mixed');
    assert.equal(payload.sections.length, 7);
    assert.equal(payload.sections[0].type, 'vocabulary');
    assert.equal(payload.sections[0].questionCount, 10);
    assert.equal(payload.sections[1].type, 'sign');
    assert.equal(payload.sections[1].questionCount, 5);
    assert.equal(payload.sections[2].type, 'reading');
    assert.equal(payload.sections[2].groupCount, 1);
    assert.equal(payload.sections[3].type, 'cloze');
    assert.equal(payload.sections[3].groupCount, 1);
    assert.equal(payload.sections[4].type, 'listening');
    assert.equal(payload.sections[4].groupCount, 2);
    assert.equal(payload.sections[5].type, 'speaking');
    assert.equal(payload.sections[5].responseType, 'textarea');
    assert.equal(payload.sections[6].type, 'writing');
    assert.equal(payload.sections[6].responseType, 'textarea');
    assert.equal(payload.subjectiveSectionCount, 2);
    assert.equal(Object.hasOwn(payload.sections[0].questions[0], 'correctAnswer'), false);
    assert.equal(Object.hasOwn(payload.sections[2].groups[0].questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/submit scores submitted answers', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizType: 'vocabulary', questionIds: [1, 2, 3], answers: { '1': 'C', '2': 'D', '3': 'A' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.score, 2);
    assert.equal(payload.total, 3);
    assert.equal(payload.unanswered, 0);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/submit scores sign answers against sign dataset', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizType: 'sign', questionIds: [1, 2, 3], answers: { '1': 'B', '2': 'D', '3': 'A' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.score, 3);
    assert.equal(payload.total, 3);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/submit scores reading answers against reading dataset', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizType: 'reading', questionIds: [1, 2, 3], answers: { '1': 'D', '2': 'A', '3': 'C' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.score, 3);
    assert.equal(payload.total, 3);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/submit scores cloze answers against cloze dataset', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizType: 'cloze', questionIds: [1, 2, 3], answers: { '1': 'C', '2': 'B', '3': 'C' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.score, 3);
    assert.equal(payload.total, 3);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/submit scores listening fill answers case-insensitively', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizType: 'listening', questionIds: [1, 2, 46], answers: { '1': 'professional', '2': 'CAREER', '46': 'false' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.score, 3);
    assert.equal(payload.total, 3);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/mixed-exam/submit scores answers across mixed datasets', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/mixed-exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionIds: ['vocabulary:1', 'sign:1', 'reading:1', 'cloze:1', 'listening:1'],
        answers: {
          'vocabulary:1': 'C',
          'sign:1': 'B',
          'reading:1': 'D',
          'cloze:1': 'C',
          'listening:1': 'professional',
        },
      }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.score, 5);
    assert.equal(payload.total, 5);
    assert.equal(payload.unanswered, 0);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/submit rejects missing questionIds', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizType: 'vocabulary', answers: { '1': 'C' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 400);
    assert.match(payload.error, /Thiếu danh sách câu hỏi/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/submit rejects invalid quiz type', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizType: 'abc', questionIds: [1], answers: { '1': 'A' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 400);
    assert.match(payload.error, /Loại bài không hợp lệ/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/submit rejects duplicate questionIds', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizType: 'vocabulary', questionIds: [5, 5, 5], answers: { '5': 'A' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 400);
    assert.match(payload.error, /bị trùng/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET / returns the main HTML page', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/');

    assert.equal(response.statusCode, 200);
    assert.match(response.body, /Trắc Nghiệm HUTECH/);
    assert.match(response.body, /Reading Comprehension/);
    assert.match(response.body, /Cloze Text/);
    assert.match(response.body, /Listening/);
    assert.match(response.body, /Vocabulary/);
    assert.match(response.body, /Sign/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /mixed-exam.html returns the mixed exam page', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/mixed-exam.html');

    assert.equal(response.statusCode, 200);
    assert.match(response.body, /Đề tổng hợp/);
    assert.match(response.body, /Vocabulary 10 câu/);
    assert.match(response.body, /Listening random 2 bài/);
    assert.match(response.body, /Writing 1 topic/);
    assert.match(response.body, /Speaking 1 topic/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /sign/01.png serves sign image assets', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/sign/01.png');

    assert.equal(response.statusCode, 200);
    assert.match(String(response.headers['content-type'] || ''), /image\/png/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
