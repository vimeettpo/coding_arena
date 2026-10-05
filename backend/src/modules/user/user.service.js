const mongoose = require('mongoose');
const { query } = require('../../config/postgres');
const Student = require('../../models/Student');
const Trainer = require('../../models/Trainer');
const { ResourceNotFoundException } = require('../../common/errors');

/**
 * User Service:
 * Primary user repository is Neon PostgreSQL (users table).
 * MongoDB Student/Trainer models are checked as fallback if MongoDB is connected.
 */

async function getById(id) {
  if (!id) throw ResourceNotFoundException.of('User', 'id', id);

  try {
    const res = await query(
      'SELECT id, name, username, email, password_hash, role, college, avatar_url, email_verified, enabled, approved, created_at, updated_at FROM users WHERE id::text = $1',
      [String(id)]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (err) {
    // If not a valid UUID or PG error, fall through to MongoDB check
  }

  // Fallback to legacy Mongo models if MongoDB is connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const student = await Student.findById(id).catch(() => null);
    if (student) return student;
    const trainer = await Trainer.findById(id).catch(() => null);
    if (trainer) return trainer;
  }

  throw ResourceNotFoundException.of('User', 'id', id);
}

async function getByEmail(email) {
  if (!email) throw ResourceNotFoundException.of('User', 'email', email);
  const normalized = email.toLowerCase().trim();

  try {
    const res = await query(
      `SELECT id, name, username, email, password_hash, role, college, avatar_url, email_verified, enabled, approved, created_at, updated_at
       FROM users
       WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR LOWER(name) = $1
       LIMIT 1`,
      [normalized]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (err) {
    console.error('Error querying user by email in PostgreSQL:', err.message);
  }

  // Fallback to legacy Mongo models if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const student = await Student.findOne({ email: normalized }).catch(() => null);
    if (student) return student;
    const trainer = await Trainer.findOne({ email: normalized }).catch(() => null);
    if (trainer) return trainer;
  }

  throw ResourceNotFoundException.of('User', 'email', email);
}

async function existsByEmail(email) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  try {
    const res = await query('SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
    if (res.rows.length > 0) {
      return true;
    }
  } catch (err) {
    console.error('Error checking user existence in PostgreSQL:', err.message);
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const [studentExists, trainerExists] = await Promise.all([
      Student.exists({ email: normalized }).catch(() => false),
      Trainer.exists({ email: normalized }).catch(() => false),
    ]);
    return Boolean(studentExists || trainerExists);
  }

  return false;
}

async function save(user) {
  if (user && user.save && typeof user.save === 'function') {
    await user.save();
    return user;
  }
  return user;
}

function toResponse(user) {
  if (!user) return null;
  return {
    id: String(user.id || user._id),
    name: user.name,
    username: user.username || user.name,
    email: user.email,
    role: user.role,
    college: user.college || null,
    avatarUrl: user.avatar_url || user.avatarUrl || null,
    emailVerified: Boolean(user.email_verified ?? user.emailVerified ?? true),
    enabled: Boolean(user.enabled ?? true),
    approved: Boolean(user.approved ?? true),
    createdAt: user.created_at || user.createdAt,
    updatedAt: user.updated_at || user.updatedAt,
  };
}

module.exports = { getById, getByEmail, existsByEmail, save, toResponse };
