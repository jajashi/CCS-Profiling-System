require('dotenv').config();

const express = require('express');
const cors = require("cors");
const path = require('path');
const { connectDB } = require('./config/database');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const specializationRoutes = require('./routes/specializationRoutes');
const authRoutes = require('./routes/authRoutes');
const curriculumRoutes = require('./routes/curriculumRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const schedulingRoutes = require('./routes/schedulingRoutes');
const eventRoutes = require('./routes/eventRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { startRsvpAutoCloseJob } = require('./jobs/rsvpAutoCloseJob');

const app = express();
const PORT = process.env.PORT || 5000;

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = configuredOrigins.length === 0;
const allowedOrigins = new Set(configuredOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowAllOrigins || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/students", studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/curricula', curriculumRoutes);
app.use('/api/syllabi', syllabusRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
    startRsvpAutoCloseJob();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
