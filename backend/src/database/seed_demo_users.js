const { initPostgres, query } = require('../config/postgres');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('--- SEEDING DEMO CREDENTIALS ---');
  await initPostgres();

  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const studentPasswordHash = await bcrypt.hash('Student@123', 12);

  // 1. Ensure codearena.com is in allowed_email_domains as well
  await query(`
    INSERT INTO allowed_email_domains (domain)
    VALUES ('gmail.com'), ('googlemail.com'), ('codearena.com'), ('vimeet.ac.in')
    ON CONFLICT (domain) DO NOTHING;
  `);

  // 2. Upsert Admin user (admin@gmail.com / username: admin)
  const existingAdmin = await query('SELECT id FROM users WHERE LOWER(email) = $1', ['admin@gmail.com']);
  if (existingAdmin.rows.length > 0) {
    await query(
      `UPDATE users 
       SET name = $1, username = $2, password_hash = $3, role = 'ADMIN', email_verified = TRUE, enabled = TRUE, approved = TRUE, updated_at = NOW()
       WHERE LOWER(email) = $4`,
      ['System Administrator', 'admin', adminPasswordHash, 'admin@gmail.com']
    );
    console.log('✓ Updated existing Admin user (admin@gmail.com / username: admin) password to Admin@123');
  } else {
    await query(
      `INSERT INTO users (name, username, email, password_hash, role, email_verified, enabled, approved, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'ADMIN', TRUE, TRUE, TRUE, NOW(), NOW())`,
      ['System Administrator', 'admin', 'admin@gmail.com', adminPasswordHash]
    );
    console.log('✓ Created Admin user (admin@gmail.com / username: admin)');
  }

  // 3. Upsert Student user (student@gmail.com / username: student)
  const existingStudent = await query('SELECT id FROM users WHERE LOWER(email) = $1', ['student@gmail.com']);
  if (existingStudent.rows.length > 0) {
    await query(
      `UPDATE users 
       SET name = $1, username = $2, password_hash = $3, role = 'STUDENT', college = 'Vishwaniketan iMEET', branch = 'Computer Engineering', year = 3, email_verified = TRUE, enabled = TRUE, approved = TRUE, updated_at = NOW()
       WHERE LOWER(email) = $4`,
      ['Demo Student', 'student', studentPasswordHash, 'student@gmail.com']
    );
    console.log('✓ Updated existing Demo Student user (student@gmail.com / username: student) password to Student@123');
  } else {
    await query(
      `INSERT INTO users (name, username, email, password_hash, role, college, branch, year, email_verified, enabled, approved, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'STUDENT', 'Vishwaniketan iMEET', 'Computer Engineering', 3, TRUE, TRUE, TRUE, NOW(), NOW())`,
      ['Demo Student', 'student', 'student@gmail.com', studentPasswordHash]
    );
    console.log('✓ Created Demo Student user (student@gmail.com / username: student)');
  }

  // 4. Verify login with authService
  const authService = require('../modules/auth/auth.service');
  const adminLogin = await authService.login({ email: 'admin@gmail.com', password: 'Admin@123' });
  console.log('✓ Admin login test verified: User ID =', adminLogin.user.id, 'Role =', adminLogin.user.role);

  const studentLogin = await authService.login({ email: 'student@gmail.com', password: 'Student@123' });
  console.log('✓ Student login test verified: User ID =', studentLogin.user.id, 'Role =', studentLogin.user.role);

  // Also verify username login
  const adminByUsername = await authService.login({ email: 'admin', password: 'Admin@123' });
  console.log('✓ Admin username login verified: User ID =', adminByUsername.user.id);

  const studentByUsername = await authService.login({ email: 'student', password: 'Student@123' });
  console.log('✓ Student username login verified: User ID =', studentByUsername.user.id);

  console.log('\n--- DEMO CREDENTIALS SEEDED & VERIFIED SUCCESSFULLY ---');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
