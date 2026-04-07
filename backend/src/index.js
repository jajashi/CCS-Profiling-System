require('dotenv').config();

const express = require('express');
const { connectDB } = require('./config/database');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const specializationRoutes = require('./routes/specializationRoutes');

const app = express();
const PORT = process.env.PORT;

if (!PORT) {
  console.error('PORT is not defined. Set it in your .env file (see .env.example).');
  process.exit(1);
}

app.use(express.json());

app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/specializations', specializationRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message =
    status === 500 ? 'Internal server error.' : err.message || 'Request failed.';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
