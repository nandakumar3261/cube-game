const express = require('express');
const Student = require('../models/Student');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// GET /api/students/lookup/:rollNumber  (PUBLIC)
// Used by the game page to auto-fill a player's details before they play.
router.get('/lookup/:rollNumber', async (req, res) => {
  try {
    const student = await Student.findOne({ rollNumber: req.params.rollNumber.trim() });
    if (!student) {
      return res.status(404).json({ error: 'No student found with that roll number.' });
    }
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during lookup.' });
  }
});

// Everything below this line requires an admin token.
router.use(requireAdmin);

// GET /api/students  — list all students
router.get('/', async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });
  res.json(students);
});

// POST /api/students  — add one student
// Body: { rollNumber, name, college, branch, section }
router.post('/', async (req, res) => {
  try {
    const { rollNumber, name, college, branch, section } = req.body;
    if (!rollNumber || !name || !college || !branch || !section) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const student = await Student.create({ rollNumber, name, college, branch, section });
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A student with that roll number already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error while creating student.' });
  }
});

// POST /api/students/bulk  — bulk import
// Body: { students: [ { rollNumber, name, college, branch, section }, ... ] }
router.post('/bulk', async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Provide a non-empty "students" array.' });
    }

    const results = { inserted: 0, skipped: [] };
    for (const s of students) {
      if (!s.rollNumber || !s.name || !s.college || !s.branch || !s.section) {
        results.skipped.push({ row: s, reason: 'Missing field(s).' });
        continue;
      }
      try {
        await Student.create(s);
        results.inserted += 1;
      } catch (err) {
        results.skipped.push({ row: s, reason: err.code === 11000 ? 'Duplicate roll number.' : 'Insert failed.' });
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during bulk import.' });
  }
});

// PUT /api/students/:id  — edit a student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating student.' });
  }
});

// DELETE /api/students/:id
router.delete('/:id', async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  res.json({ deleted: true });
});

module.exports = router;
