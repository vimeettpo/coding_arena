const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    hidden: { type: Boolean, default: true },
    weight: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'test_cases' }
);

testCaseSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('TestCase', testCaseSchema);
