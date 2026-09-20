const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    questionText: { type: String, required: true },
    options: { type: [String], default: [] },
    correctOptionIndex: { type: Number, required: true },
    points: { type: Number, default: 5 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startTime: { type: Date, required: false, default: null },
    endTime: { type: Date, required: false, default: null },
    durationMinutes: { type: Number, required: true },
    totalMarks: { type: Number, default: 0 },
    createdById: { type: String, required: true },
    questions: { type: [quizQuestionSchema], default: [] },
    codingProblems: [
      {
        problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
        points: { type: Number, default: 20 },
      },
    ],
    allowedLanguages: { type: [String], default: [] }, // e.g. ['JAVA', 'PYTHON', 'CPP', 'C', 'JAVASCRIPT']. Empty = all allowed
    targetBranch: { type: String, default: 'ALL' },
    targetYear: { type: Number, default: null },
    negativeMarking: { type: Boolean, default: false },
    negativeMarks: { type: Number, default: 0 },
    passingPercentage: { type: Number, default: 40 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'quizzes' }
);

// Mirrors Quiz.java's @Transient getStatus().
quizSchema.methods.getStatus = function getStatus() {
  const now = Date.now();
  if (this.startTime && now < this.startTime.getTime()) return 'UPCOMING';
  if (this.endTime && now > this.endTime.getTime()) return 'ENDED';
  return 'LIVE';
};

quizSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.status = doc.getStatus();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Quiz', quizSchema);
