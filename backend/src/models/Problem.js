const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], required: true },
    description: { type: String, default: '' },
    constraints: { type: String, default: '' },
    editorial: { type: String, default: null },
    tags: { type: [String], default: [] },
    hints: { type: [String], default: [] },
    timeLimitMs: { type: Number, default: 1000 },
    memoryLimitMb: { type: Number, default: 256 },
    published: { type: Boolean, default: false },
    createdById: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'problems' }
);

problemSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Problem', problemSchema);
