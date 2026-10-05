/**
 * Field set shared by Student and Trainer — mirrors the abstract User.java
 * base class. Spring stores students/trainers in separate collections
 * ("students" / "trainers"); we mirror that with two Mongoose models
 * instead of a single discriminator collection, so lookups by email/id
 * still have to check both (see modules/user/user.service.js).
 */
const userFields = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['STUDENT', 'TRAINER', 'ADMIN'], required: true },
  emailVerified: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  // Trainer accounts require admin approval before they can create contests.
  approved: { type: Boolean, default: true },
  college: { type: String, default: null },
  avatarUrl: { type: String, default: null },
  otpCode: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
};

module.exports = { userFields };
