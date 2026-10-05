const mongoose = require('mongoose');

const contestParticipantSchema = new mongoose.Schema(
  {
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
    userId: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'contest_participants' }
);

contestParticipantSchema.index({ contestId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ContestParticipant', contestParticipantSchema);
