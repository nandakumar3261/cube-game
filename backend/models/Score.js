const mongoose = require('mongoose');

// Score documents are denormalized (name/college/branch/section copied in)
// so the public leaderboard can be read with a single fast query and no joins.
const scoreSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true, trim: true },
  name: { type: String, required: true },
  college: { type: String, required: true },
  branch: { type: String, required: true },
  section: { type: String, required: true },
  timeTakenMs: { type: Number, required: true, min: 0 },
  playedAt: { type: Date, default: Date.now }
});

// Leaderboard queries always sort by fastest time — index it.
scoreSchema.index({ timeTakenMs: 1 });

module.exports = mongoose.model('Score', scoreSchema);
