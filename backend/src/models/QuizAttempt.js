const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: { type: String, required: true },
    userId: { type: String, required: true },
    answers: { type: Map, of: Number, default: {} },
    mcqScore: { type: Number, default: 0 },
    codingScore: { type: Number, default: 0 },
    codingScores: [
      {
        problemId: { type: String },
        score: { type: Number, default: 0 },
        status: { type: String, default: 'PENDING' },
        language: { type: String, default: '' },
        code: { type: String, default: '' },
      },
    ],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'quiz_attempts' }
);

quizAttemptSchema.index({ quizId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
