const mongoose = require('mongoose');
const { userFields } = require('./userFields');

const studentSchema = new mongoose.Schema(
  {
    ...userFields,
    year: { type: String, default: null },
    branch: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'students' }
);

studentSchema.set('toJSON', {
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

module.exports = mongoose.model('Student', studentSchema);
