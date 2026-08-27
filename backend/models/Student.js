const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  college: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
