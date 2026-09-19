const http = require('http');
const assert = require('assert');
const app = require('./src/app');
const { initPostgres, query } = require('./src/config/postgres');

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      hostname: '127.0.0.1',
      port: address.port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testHttpRoutes() {
  console.log('--- TESTING HTTP API ENDPOINTS WITH POSTGRESQL ---');
  await initPostgres();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`Test Express server running on port ${port}`);

  const testEmail = 'api_test_student@codearena.local';
  await query('DELETE FROM users WHERE LOWER(email) = $1', [testEmail]);

  try {
    // 1. POST /api/auth/register
    const regRes = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'API Student',
      email: testEmail,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      college: 'MIT College',
    });
    console.log(`1. POST /api/auth/register: Status ${regRes.status}`);
    assert.strictEqual(regRes.status, 200);

    // 2. Duplicate registration -> 409
    const dupRes = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Duplicate Student',
      email: testEmail,
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });
    console.log(`2. Duplicate register: Status ${dupRes.status} (Expected 409)`);
    assert.strictEqual(dupRes.status, 409);

    // 3. POST /api/auth/login wrong password -> 401
    const badLoginRes = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: 'WrongPassword!',
    });
    console.log(`3. Bad login: Status ${badLoginRes.status} (Expected 401)`);
    assert.strictEqual(badLoginRes.status, 401);

    // 4. POST /api/auth/login valid credentials -> 200
    const loginRes = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: 'StrongPassword123!',
    });
    console.log(`4. Valid login: Status ${loginRes.status}`);
    assert.strictEqual(loginRes.status, 200);
    assert(loginRes.data.data.accessToken, 'Access token returned');
    assert(loginRes.data.data.refreshToken, 'Refresh token returned');
    assert.strictEqual(loginRes.data.data.user.email, testEmail);

    const accessToken = loginRes.data.data.accessToken;
    const refreshToken = loginRes.data.data.refreshToken;

    // 5. GET /api/auth/me with Bearer token -> 200
    const meRes = await makeRequest(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(`5. GET /api/auth/me (authenticated): Status ${meRes.status}`);
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.data.email, testEmail);
    assert.strictEqual(meRes.data.data.password_hash, undefined, 'password_hash hidden');

    // 6. GET /api/auth/me without token -> 401
    const unauthMeRes = await makeRequest(server, { path: '/api/auth/me', method: 'GET' });
    console.log(`6. GET /api/auth/me (unauthenticated): Status ${unauthMeRes.status} (Expected 401)`);
    assert.strictEqual(unauthMeRes.status, 401);

    // 7. GET /api/problems without token -> 401 (Protected Route)
    const unauthProblemsRes = await makeRequest(server, { path: '/api/problems', method: 'GET' });
    console.log(`7. GET /api/problems (unauthenticated): Status ${unauthProblemsRes.status} (Expected 401)`);
    assert.strictEqual(unauthProblemsRes.status, 401);

    // 8. POST /api/auth/refresh -> 200 with new accessToken
    const refreshRes = await makeRequest(server, { path: '/api/auth/refresh', method: 'POST' }, {
      refreshToken,
    });
    console.log(`8. POST /api/auth/refresh: Status ${refreshRes.status}`);
    assert.strictEqual(refreshRes.status, 200);
    assert(refreshRes.data.data.accessToken, 'New access token returned');

    // 9. POST /api/auth/logout with Bearer token -> 200
    const logoutRes = await makeRequest(server, {
      path: '/api/auth/logout',
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(`9. POST /api/auth/logout: Status ${logoutRes.status}`);
    assert.strictEqual(logoutRes.status, 200);

    // Cleanup
    await query('DELETE FROM users WHERE LOWER(email) = $1', [testEmail]);
    console.log('✓ Cleaned up test user.');

    console.log('\n--- ALL HTTP API TESTS PASSED! ---');
  } finally {
    server.close();
  }
  process.exit(0);
}

testHttpRoutes().catch((err) => {
  console.error('\n❌ HTTP API TEST FAILED:', err);
  process.exit(1);
});
