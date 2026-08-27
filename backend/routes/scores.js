const express = require('express');
const rateLimit = require('express-rate-limit');
const Score = require('../models/Score');
const Student = require('../models/Student');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Must match the frontend's MAX_TIME_MS. Enforced here too so the cap
// can't be bypassed by calling the API directly instead of the game page.
const MAX_TIME_MS = 2 * 60 * 1000; // 2 minutes

// Light rate limit so nobody scripts fake ultra-fast submissions.
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many submissions — slow down and try again shortly.' }
});

// POST /api/scores  (PUBLIC)
// Body: { rollNumber, timeTakenMs }
// Student must already exist (added by admin) — details are pulled from there,
// never trusted from the client, so a player can't fake their own name/college.
router.post('/', submitLimiter, async (req, res) => {
  try {
    const { rollNumber, timeTakenMs } = req.body;

    if (!rollNumber || typeof timeTakenMs !== 'number' || timeTakenMs <= 0) {
      return res.status(400).json({ error: 'rollNumber and a positive timeTakenMs are required.' });
    }

    if (timeTakenMs >= MAX_TIME_MS) {
      return res.status(400).json({ error: 'Time exceeds the 2 minute limit — this attempt cannot be saved.' });
    }

    const student = await Student.findOne({ rollNumber: rollNumber.trim() });
    if (!student) {
      return res.status(404).json({ error: 'No student found with that roll number. Ask an admin to add you first.' });
    }

    const score = await Score.create({
      rollNumber: student.rollNumber,
      name: student.name,
      college: student.college,
      branch: student.branch,
      section: student.section,
      timeTakenMs
    });

    res.status(201).json(score);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while saving score.' });
  }
});

// GET /api/scores/leaderboard  (PUBLIC)
// Query params (all optional): limit, college, branch, section
// Returns fastest time PER STUDENT (not every attempt), sorted ascending.
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const match = {};
    if (req.query.college) match.college = req.query.college;
    if (req.query.branch) match.branch = req.query.branch;
    if (req.query.section) match.section = req.query.section;

    const leaderboard = await Score.aggregate([
      { $match: match },
      { $sort: { timeTakenMs: 1 } },
      {
        $group: {
          _id: '$rollNumber',
          name: { $first: '$name' },
          college: { $first: '$college' },
          branch: { $first: '$branch' },
          section: { $first: '$section' },
          bestTimeMs: { $first: '$timeTakenMs' },
          playedAt: { $first: '$playedAt' }
        }
      },
      { $sort: { bestTimeMs: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          rollNumber: '$_id',
          name: 1, college: 1, branch: 1, section: 1, bestTimeMs: 1, playedAt: 1
        }
      }
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching leaderboard.' });
  }
});

// DELETE /api/scores  (admin only) — clear all scores, e.g. before a new event.
router.delete('/', requireAdmin, async (req, res) => {
  await Score.deleteMany({});
  res.json({ cleared: true });
});

module.exports = router;
