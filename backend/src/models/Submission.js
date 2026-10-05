const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    contestId: { type: String, default: null, index: true },
    language: { type: String, enum: ['JAVA', 'PYTHON', 'CPP', 'C', 'JAVASCRIPT'], required: true },
    code: { type: String, required: true },
    verdict: {
      type: String,
      enum: [
        'PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED',
        'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'PRESENTATION_ERROR',
      ],
      default: 'PENDING',
    },
    runtimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    testCasesPassed: { type: Number, default: 0 },
    testCasesTotal: { type: Number, default: 0 },
    judgeOutput: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'submissions' }
);

submissionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Submission', submissionSchema);
