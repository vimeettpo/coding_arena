const mongoose = require('mongoose');

const aptitudeAttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    category: { type: String, required: true }, // QUANTITATIVE | LOGICAL | VERBAL | MIXED
    difficulty: { type: String, default: 'ANY' }, // ANY | EASY | MEDIUM | HARD
    negativeMarking: { type: Boolean, default: false },

    // questions served (in order) and the option order shown for each one
    questionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    optionOrders: { type: [[Number]], default: [] },

    durationSeconds: { type: Number, required: true },
    status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED', 'ABANDONED'], default: 'IN_PROGRESS' },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    timeTakenSeconds: { type: Number, default: 0 },
    late: { type: Boolean, default: false },

    // selectedIndex is the position the student saw (after shuffling); null = skipped
    answers: [
      {
        _id: false,
        questionId: { type: mongoose.Schema.Types.ObjectId },
        selectedIndex: { type: Number, default: null },
      },
    ],

    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    unanswered: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    topicBreakdown: [{ _id: false, topic: String, correct: Number, total: Number }],
    categoryBreakdown: [{ _id: false, category: String, correct: Number, total: Number }],
  },
  { timestamps: true, collection: 'aptitude_attempts' }
);

aptitudeAttemptSchema.index({ userId: 1, status: 1, startedAt: -1 });

module.exports = mongoose.model('AptitudeAttempt', aptitudeAttemptSchema);
