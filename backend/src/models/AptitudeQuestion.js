const mongoose = require('mongoose');
const { CATEGORIES, DIFFICULTIES } = require('../modules/aptitude/aptitude.constants');

const aptitudeQuestionSchema = new mongoose.Schema(
  {
    category: { type: String, enum: CATEGORIES, required: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: [(arr) => arr.length >= 2 && arr.length <= 6, 'A question needs between 2 and 6 options.'],
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: '' },
    // true = never shuffle the options (order-dependent questions)
    fixedOrder: { type: Boolean, default: false },
    // soft-delete flag: old attempts keep referencing the question for review
    active: { type: Boolean, default: true },
    // set only for built-in starter questions (makes seeding idempotent)
    seedKey: { type: String },
    createdBy: { type: String, default: null },
  },
  { timestamps: true, collection: 'aptitude_questions' }
);

aptitudeQuestionSchema.index({ active: 1, category: 1, difficulty: 1 });
aptitudeQuestionSchema.index(
  { seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: 'string' } } }
);

module.exports = mongoose.model('AptitudeQuestion', aptitudeQuestionSchema);
