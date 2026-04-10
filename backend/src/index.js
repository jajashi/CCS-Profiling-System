require('dotenv').config();

const express = require('express');
const cors = require("cors");
const { connectDB } = require('./config/database');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const specializationRoutes = require('./routes/specializationRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = configuredOrigins.length === 0;
const allowedOrigins = new Set(configuredOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '8mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/students", studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/specializations', specializationRoutes);

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  let message =
    status === 500 ? 'Internal server error.' : err.message || 'Request failed.';

  if (status === 413) {
    message = 'Uploaded image is too large. Please use a smaller file.';
  }

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
