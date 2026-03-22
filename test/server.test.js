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

test('GET /api/quizzes/english100/questions returns quiz payload without answers', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes/english100/questions');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizId, 'english100');
    assert.equal(payload.mode, 'full');
    assert.equal(payload.total, 100);
    assert.equal(payload.questions.length, 100);
    assert.equal(Object.hasOwn(payload.questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/quizzes returns both quiz definitions', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizzes.length, 3);
    assert.deepEqual(payload.quizzes.map((quiz) => quiz.id), ['english100', 'readingMixed', 'signs40']);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/quizzes/english100/questions?mode=random10 returns a 10-question subset', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes/english100/questions?mode=random10');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizId, 'english100');
    assert.equal(payload.mode, 'random10');
    assert.equal(payload.total, 10);
    assert.equal(payload.availableTotal, 100);
    assert.equal(payload.questions.length, 10);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/quizzes/readingMixed/questions?mode=randomGroup returns one reading set', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes/readingMixed/questions?mode=randomGroup');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizId, 'readingMixed');
    assert.equal(payload.mode, 'randomGroup');
    assert.equal(payload.total, 5);
    assert.equal(payload.availableTotal, 20);
    assert.equal(payload.questions.length, 5);
    assert.equal(new Set(payload.questions.map((question) => question.group)).size, 1);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/quizzes/signs40/questions?mode=random5 returns a 5-question subset', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes/signs40/questions?mode=random5');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.quizId, 'signs40');
    assert.equal(payload.mode, 'random5');
    assert.equal(payload.total, 5);
    assert.equal(payload.availableTotal, 40);
    assert.equal(payload.questions.length, 5);
    assert.equal(Object.hasOwn(payload.questions[0], 'correctAnswer'), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/quizzes/signs40/submit scores submitted answers', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes/signs40/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIds: [1, 2, 3], answers: { '1': 'B', '2': 'D', '3': 'A' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.score, 3);
    assert.equal(payload.total, 3);
    assert.equal(payload.unanswered, 0);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/quizzes/english100/submit rejects missing questionIds', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes/english100/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: { '1': 'C' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 400);
    assert.match(payload.error, /Thiếu danh sách câu hỏi/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/quizzes/english100/submit rejects duplicate questionIds', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes/english100/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIds: [5, 5, 5], answers: { '5': 'A' } }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 400);
    assert.match(payload.error, /bị trùng/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET /api/quizzes/unknown/questions returns 404', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/api/quizzes/unknown/questions');
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 404);
    assert.match(payload.error, /Không tìm thấy bộ đề/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET / returns the landing HTML page', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await request(baseUrl, '/');

    assert.equal(response.statusCode, 200);
    assert.match(response.body, /HUTECH Quiz Hub/);
    assert.match(response.body, /english-100.html/);
    assert.match(response.body, /reading-mixed.html/);
    assert.match(response.body, /signs-40.html/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('GET quiz pages returns all dedicated quiz pages', async () => {
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const englishPage = await request(baseUrl, '/english-100.html');
    const readingPage = await request(baseUrl, '/reading-mixed.html');
    const signsPage = await request(baseUrl, '/signs-40.html');

    assert.equal(englishPage.statusCode, 200);
    assert.equal(readingPage.statusCode, 200);
    assert.equal(signsPage.statusCode, 200);
    assert.match(englishPage.body, /Bộ đề trắc nghiệm tiếng Anh 100 câu/);
    assert.match(readingPage.body, /Bộ đề reading TEXT 1, 6, 11, 23/);
    assert.match(signsPage.body, /Bộ đề trắc nghiệm biển báo/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
