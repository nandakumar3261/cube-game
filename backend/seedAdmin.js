// Run once: npm run seed-admin
// Creates (or updates the password of) the admin account defined in .env
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function run() {
  const { MONGO_URI, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD } = process.env;

  if (!SEED_ADMIN_USERNAME || !SEED_ADMIN_PASSWORD) {
    console.error('Set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD in your .env file first.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

  const admin = await Admin.findOneAndUpdate(
    { username: SEED_ADMIN_USERNAME },
    { username: SEED_ADMIN_USERNAME, passwordHash },
    { upsert: true, new: true }
  );

  console.log(`Admin account ready: ${admin.username}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
