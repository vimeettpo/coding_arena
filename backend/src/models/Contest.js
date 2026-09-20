const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    negativeMarking: { type: Boolean, default: false },
    createdById: { type: String, required: true },
    problemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    allowedLanguages: { type: [String], default: [] },
    targetBranch: { type: String, default: 'ALL' },
    targetYear: { type: Number, default: null },
    passingPercentage: { type: Number, default: 50 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'contests' }
);

// Mirrors Contest.java's @Transient getStatus().
contestSchema.methods.getStatus = function getStatus() {
  const now = Date.now();
  if (now < this.startTime.getTime()) return 'UPCOMING';
  if (now > this.endTime.getTime()) return 'ENDED';
  return 'LIVE';
};

contestSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.status = doc.getStatus();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Contest', contestSchema);
