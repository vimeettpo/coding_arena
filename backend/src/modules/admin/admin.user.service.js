const bcrypt = require('bcryptjs');
const { query } = require('../../config/postgres');
const {
  BadRequestException,
  ResourceNotFoundException,
  DuplicateResourceException,
  UnauthorizedActionException,
} = require('../../common/errors');
const { COLLEGE_BRANCHES, ROLES } = require('./admin.constants');

const BCRYPT_ROUNDS = 12;

/**
 * List all users with pagination, search, branch and role filters.
 */
async function listUsers({ page = 0, size = 15, search = '', role = '', branch = '', year = null, status = '' }) {
  const p = Math.max(0, parseInt(page, 10));
  const s = Math.min(100, Math.max(1, parseInt(size, 10)));
  const offset = p * s;

  let whereClauses = [];
  let params = [];
  let paramIdx = 1;

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    whereClauses.push(`(LOWER(name) LIKE $${paramIdx} OR LOWER(email) LIKE $${paramIdx} OR LOWER(COALESCE(college_id, '')) LIKE $${paramIdx})`);
    params.push(term);
    paramIdx++;
  }

  if (role && ROLES.includes(role.toUpperCase())) {
    whereClauses.push(`role = $${paramIdx}`);
    params.push(role.toUpperCase());
    paramIdx++;
  }

  if (branch && COLLEGE_BRANCHES.includes(branch)) {
    whereClauses.push(`branch = $${paramIdx}`);
    params.push(branch);
    paramIdx++;
  }

  if (year && !isNaN(parseInt(year, 10))) {
    whereClauses.push(`year = $${paramIdx}`);
    params.push(parseInt(year, 10));
    paramIdx++;
  }

  if (status === 'active') {
    whereClauses.push('enabled = TRUE');
  } else if (status === 'disabled') {
    whereClauses.push('enabled = FALSE');
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM users ${whereSql}`;
  const totalRes = await query(countQuery, params);
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataQuery = `
    SELECT id, name, username, email, role, college, college_id, branch, year, teaching_domain, avatar_url, email_verified, enabled, approved, created_at, updated_at
    FROM users
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  params.push(s, offset);

  const result = await query(dataQuery, params);

  return {
    content: result.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      username: row.username,
      email: row.email,
      role: row.role,
      college: row.college,
      collegeId: row.college_id,
      branch: row.branch,
      year: row.year,
      teachingDomain: row.teaching_domain,
      avatarUrl: row.avatar_url,
      emailVerified: Boolean(row.email_verified),
      enabled: Boolean(row.enabled),
      approved: Boolean(row.approved),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    page: p,
    size: s,
    totalElements: total,
    totalPages: Math.ceil(total / s) || 1,
  };
}

/**
 * Manually create a single user
 */
async function createUser(data) {
  const email = (data.email || '').toLowerCase().trim();
  const existing = await query('SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1', [email]);
  if (existing.rows.length > 0) {
    throw new DuplicateResourceException(`User with email "${email}" already exists.`);
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const username = data.username ? data.username.trim().toLowerCase() : email.split('@')[0];

  const res = await query(
    `INSERT INTO users (name, username, email, password_hash, role, college, college_id, branch, year, teaching_domain, email_verified, enabled, approved, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, TRUE, TRUE, NOW(), NOW())
     RETURNING id, name, username, email, role, college, college_id, branch, year, teaching_domain, avatar_url, email_verified, enabled, approved, created_at`,
    [
      data.name.trim(),
      username,
      email,
      passwordHash,
      data.role || 'STUDENT',
      data.college || 'VIMEET',
      data.collegeId || null,
      data.branch || null,
      data.year || null,
      data.teachingDomain || null,
    ]
  );

  return res.rows[0];
}

/**
 * Bulk import students from parsed CSV payload.
 */
async function bulkImportUsers(students, defaultPassword = 'Student@123') {
  if (!Array.isArray(students) || students.length === 0) {
    throw new BadRequestException('Student list cannot be empty.');
  }

  const passwordHash = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);
  let importedCount = 0;
  let skippedCount = 0;
  const skippedEmails = [];

  for (const student of students) {
    const email = (student.email || '').toLowerCase().trim();
    if (!email) {
      skippedCount++;
      continue;
    }

    try {
      const username = email.split('@')[0];
      const res = await query(
        `INSERT INTO users (name, username, email, password_hash, role, college, college_id, branch, year, email_verified, enabled, approved, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'STUDENT', 'VIMEET', $5, $6, $7, TRUE, TRUE, TRUE, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [
          student.name.trim(),
          username,
          email,
          passwordHash,
          student.collegeId || null,
          student.branch || null,
          student.year ? parseInt(student.year, 10) : null,
        ]
      );

      if (res.rowCount > 0) {
        importedCount++;
      } else {
        skippedCount++;
        skippedEmails.push(email);
      }
    } catch (err) {
      skippedCount++;
      skippedEmails.push(email);
    }
  }

  return {
    totalSubmitted: students.length,
    importedCount,
    skippedCount,
    skippedEmails,
    defaultPassword,
  };
}

/**
 * Update user role with safeguard preventing self-demotion
 */
async function updateUserRole(userId, newRole, currentAdminId) {
  if (String(userId) === String(currentAdminId) && newRole !== 'ADMIN') {
    throw new UnauthorizedActionException('You cannot remove your own admin privileges.');
  }

  const res = await query(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id::text = $2 RETURNING id, name, email, role`,
    [newRole, String(userId)]
  );

  if (res.rows.length === 0) {
    throw ResourceNotFoundException.of('User', 'id', userId);
  }

  return res.rows[0];
}

/**
 * Toggle user enabled status
 */
async function updateUserStatus(userId, enabled, currentAdminId) {
  if (String(userId) === String(currentAdminId) && !enabled) {
    throw new UnauthorizedActionException('You cannot disable your own admin account.');
  }

  const res = await query(
    `UPDATE users SET enabled = $1, updated_at = NOW() WHERE id::text = $2 RETURNING id, name, email, enabled`,
    [Boolean(enabled), String(userId)]
  );

  if (res.rows.length === 0) {
    throw ResourceNotFoundException.of('User', 'id', userId);
  }

  // If disabled, revoke active refresh tokens
  if (!enabled) {
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id::text = $1', [String(userId)]).catch(() => {});
  }

  return res.rows[0];
}

/**
 * Update user profile fields (branch, year, collegeId, name)
 */
async function updateUser(userId, data) {
  const fields = [];
  const params = [];
  let idx = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${idx++}`);
    params.push(data.name.trim());
  }
  if (data.collegeId !== undefined) {
    fields.push(`college_id = $${idx++}`);
    params.push(data.collegeId || null);
  }
  if (data.branch !== undefined) {
    fields.push(`branch = $${idx++}`);
    params.push(data.branch || null);
  }
  if (data.year !== undefined) {
    fields.push(`year = $${idx++}`);
    params.push(data.year ? parseInt(data.year, 10) : null);
  }
  if (data.teachingDomain !== undefined) {
    fields.push(`teaching_domain = $${idx++}`);
    params.push(data.teachingDomain || null);
  }

  if (fields.length === 0) {
    throw new BadRequestException('No fields provided to update.');
  }

  fields.push('updated_at = NOW()');
  params.push(String(userId));

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id::text = $${idx} RETURNING id, name, email, role, college_id, branch, year, teaching_domain`;
  const res = await query(sql, params);

  if (res.rows.length === 0) {
    throw ResourceNotFoundException.of('User', 'id', userId);
  }

  return res.rows[0];
}

/**
 * Reset password for a user
 */
async function resetUserPassword(userId, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestException('Password must be at least 6 characters long.');
  }

  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const res = await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id::text = $2 RETURNING id, email`,
    [hash, String(userId)]
  );

  if (res.rows.length === 0) {
    throw ResourceNotFoundException.of('User', 'id', userId);
  }

  // Revoke refresh tokens so user is forced to re-authenticate
  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id::text = $1', [String(userId)]).catch(() => {});

  return { message: 'Password reset successfully.', email: res.rows[0].email };
}

/**
 * Delete a user
 */
async function deleteUser(userId, currentAdminId) {
  if (String(userId) === String(currentAdminId)) {
    throw new UnauthorizedActionException('You cannot delete your own admin account.');
  }

  await query('DELETE FROM refresh_tokens WHERE user_id::text = $1', [String(userId)]).catch(() => {});
  const res = await query('DELETE FROM users WHERE id::text = $1 RETURNING id, email, name', [String(userId)]);

  if (res.rows.length === 0) {
    throw ResourceNotFoundException.of('User', 'id', userId);
  }

  return { message: `User "${res.rows[0].email}" deleted successfully.`, id: res.rows[0].id };
}

/**
 * Export filtered users to CSV text
 */
async function exportUsersCSV(role = '', branch = '') {
  let whereClauses = [];
  let params = [];
  let idx = 1;

  if (role) {
    whereClauses.push(`role = $${idx++}`);
    params.push(role.toUpperCase());
  }
  if (branch) {
    whereClauses.push(`branch = $${idx++}`);
    params.push(branch);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `
    SELECT name, email, role, COALESCE(college_id, '') as college_id, COALESCE(branch, '') as branch, COALESCE(year::text, '') as year, enabled, created_at
    FROM users
    ${whereSql}
    ORDER BY branch, name ASC
  `;

  const res = await query(sql, params);

  const header = ['Name', 'Email', 'Role', 'College ID', 'Branch', 'Year', 'Status', 'Joined Date'];
  const rows = res.rows.map((r) => [
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    r.role,
    `"${r.college_id}"`,
    `"${r.branch}"`,
    r.year,
    r.enabled ? 'Active' : 'Disabled',
    new Date(r.created_at).toISOString().split('T')[0],
  ]);

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

module.exports = {
  listUsers,
  createUser,
  bulkImportUsers,
  updateUserRole,
  updateUserStatus,
  updateUser,
  resetUserPassword,
  deleteUser,
  exportUsersCSV,
};
