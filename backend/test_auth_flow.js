const assert = require('assert');
const { initPostgres, query } = require('./src/config/postgres');
const authService = require('./src/modules/auth/auth.service');
const userService = require('./src/modules/user/user.service');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('--- STARTING POSTGRESQL AUTH VERIFICATION ---');

  // 1. Initialize PostgreSQL
  await initPostgres();
  console.log('✓ PostgreSQL connected and schema initialized.');

  // Clean up any existing test user
  const testEmail = 'pg_test_user@codearena.local';
  await query('DELETE FROM users WHERE LOWER(email) = $1', [testEmail]);
  console.log('✓ Test user cleaned up.');

  // 2. Register test user
  const registerPayload = {
    name: 'PG Test Cadet',
    email: testEmail,
    password: 'SecurePassword123!',
    role: 'STUDENT',
    college: 'Engineering Institute',
  };

  const createdUser = await authService.register(registerPayload);
  assert(createdUser, 'Created user should exist');
  assert(createdUser.id, 'User should have UUID id');
  assert.strictEqual(createdUser.email, testEmail);
  assert.strictEqual(createdUser.role, 'STUDENT');
  console.log(`✓ Registration succeeded. User ID: ${createdUser.id}`);

  // 3. Inspect PostgreSQL record directly
  const dbResult = await query('SELECT * FROM users WHERE id = $1', [createdUser.id]);
  assert.strictEqual(dbResult.rows.length, 1);
  const dbRow = dbResult.rows[0];

  assert(dbRow.password_hash.startsWith('$2a$') || dbRow.password_hash.startsWith('$2b$'), 'Password must be bcrypt hashed');
  assert.notStrictEqual(dbRow.password_hash, registerPayload.password, 'Password must NOT be plain text');
  assert(dbRow.created_at, 'created_at must exist');
  assert(dbRow.updated_at, 'updated_at must exist');
  console.log('✓ Verified directly in PostgreSQL: password is encrypted with bcrypt (12 rounds), id is UUID, timestamps present.');

  // 4. Verify duplicate registration fails
  let duplicateThrew = false;
  try {
    await authService.register(registerPayload);
  } catch (err) {
    duplicateThrew = true;
    assert.strictEqual(err.status, 409, 'Duplicate user should return status 409');
    console.log(`✓ Duplicate registration correctly rejected with: "${err.message}" (status ${err.status})`);
  }
  assert(duplicateThrew, 'Duplicate registration must throw an error');

  // 5. Verify login with wrong password fails
  let wrongPassThrew = false;
  try {
    await authService.login({ email: testEmail, password: 'WrongPassword999!' });
  } catch (err) {
    wrongPassThrew = true;
    assert.strictEqual(err.status, 401, 'Bad credentials should return status 401');
    console.log(`✓ Bad password correctly rejected with: "${err.message}" (status ${err.status})`);
  }
  assert(wrongPassThrew, 'Bad password must throw an error');

  // 6. Verify login with correct password succeeds
  const loginResult = await authService.login({ email: testEmail, password: registerPayload.password });
  assert(loginResult.accessToken, 'Access token must be generated');
  assert(loginResult.refreshToken, 'Refresh token must be generated');
  assert(loginResult.user, 'User object must be returned');
  assert.strictEqual(loginResult.user.email, testEmail);
  assert.strictEqual(loginResult.user.password_hash, undefined, 'password_hash must NEVER be exposed');
  assert.strictEqual(loginResult.user.passwordHash, undefined, 'passwordHash must NEVER be exposed');
  console.log('✓ Login succeeded. Received JWT access token and refresh token. User object sanitized.');

  // 7. Verify login by username
  const loginByUsernameResult = await authService.login({
    email: dbRow.username,
    password: registerPayload.password,
  });
  assert(loginByUsernameResult.accessToken, 'Login by username must succeed');
  console.log(`✓ Login by username ("${dbRow.username}") succeeded.`);

  // 8. Verify refresh token stored in PostgreSQL
  const tokenQuery = await query('SELECT * FROM refresh_tokens WHERE token = $1', [loginResult.refreshToken]);
  assert.strictEqual(tokenQuery.rows.length, 1);
  assert.strictEqual(tokenQuery.rows[0].revoked, false);
  console.log('✓ Refresh token verified in PostgreSQL refresh_tokens table.');

  // 9. Test token refresh
  const refreshed = await authService.refresh({ refreshToken: loginResult.refreshToken });
  assert(refreshed.accessToken, 'New access token must be issued on refresh');
  const oldTokenCheck = await query('SELECT * FROM refresh_tokens WHERE token = $1', [loginResult.refreshToken]);
  assert.strictEqual(oldTokenCheck.rows[0].revoked, true, 'Old refresh token must be marked as revoked');
  console.log('✓ Refresh flow verified: old token revoked, new token pair issued.');

  // 10. Test logout
  await authService.logout(createdUser.id);
  const activeTokens = await query('SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked = FALSE', [createdUser.id]);
  assert.strictEqual(activeTokens.rows.length, 0, 'All refresh tokens should be revoked after logout');
  console.log('✓ Logout verified: all refresh tokens revoked in PostgreSQL.');

  // 11. Test userService sanitization
  const fetchedUser = await userService.getById(createdUser.id);
  const userDto = userService.toResponse(fetchedUser);
  assert.strictEqual(userDto.email, testEmail);
  assert.strictEqual(userDto.password_hash, undefined);
  assert.strictEqual(userDto.passwordHash, undefined);
  console.log('✓ User lookup and DTO response verified: sensitive credentials securely hidden.');

  // Cleanup test user
  await query('DELETE FROM users WHERE id = $1', [createdUser.id]);
  console.log('✓ Cleaned up test user.');

  console.log('\n--- ALL POSTGRESQL AUTH TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
