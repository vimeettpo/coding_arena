const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'refresh_tokens' }
);

refreshTokenSchema.methods.isExpired = function isExpired() {
  return this.expiresAt.getTime() < Date.now();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
