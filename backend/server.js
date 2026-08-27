require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const scoreRoutes = require('./routes/scores');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/scores', scoreRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve both frontends from this same server, so the whole project
// runs as a single process on a single port.
//   http://localhost:5000          -> public game
//   http://localhost:5000/admin/   -> admin panel
app.use('/admin', express.static(path.join(__dirname, '..', 'admin-web')));
app.use('/', express.static(path.join(__dirname, '..', 'public-web')));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB at', process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`CUBE Game API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB. Is mongod running locally?', err.message);
    process.exit(1);
  });
