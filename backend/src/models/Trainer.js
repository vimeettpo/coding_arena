const mongoose = require('mongoose');
const { userFields } = require('./userFields');

const trainerSchema = new mongoose.Schema(
  {
    ...userFields,
    organization: { type: String, default: null },
    bio: { type: String, default: null },
    specialization: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'trainers' }
);

trainerSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.otpCode;
    delete ret.otpExpiresAt;
    return ret;
  },
});

module.exports = mongoose.model('Trainer', trainerSchema);
