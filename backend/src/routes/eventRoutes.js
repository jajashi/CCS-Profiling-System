const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
  fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

const {
  createEvent,
  getEvents,
  getEventById,
  rsvpToEvent,
  cancelRsvp,
  updateAttendance,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventAnalytics,
  submitFeedback,
  generateCertificates,
  downloadBulkCertificates,
  downloadUserCertificate,
  getUserEventHistory
} = require('../controllers/eventController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/upload', (req, res) => {
  upload.array('attachments', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const files = req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      type: file.mimetype
    }));
    res.json({ files });
  });
});

router.route('/')
  .post(createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEventById)
  .patch(updateEvent)
  .delete(deleteEvent);

router.post('/:id/rsvp', requireRoles('student', 'faculty'), rsvpToEvent);
router.delete('/:id/rsvp', requireRoles('student', 'faculty'), cancelRsvp);
router.post('/:id/unrsvp', requireRoles('student', 'faculty'), cancelRsvp);
router.patch('/:id/attendees/:userId', requireRoles('admin', 'faculty'), updateAttendance);

router.patch('/:id/status', requireRoles('admin', 'faculty'), updateEventStatus);
router.get('/:id/analytics', requireRoles('admin', 'faculty'), getEventAnalytics);
router.post('/:id/feedback', submitFeedback);
router.post('/:id/certificates', requireRoles('admin', 'faculty'), generateCertificates);
router.get('/:id/certificates/bulk', requireRoles('admin', 'faculty'), downloadBulkCertificates);
router.get('/:id/certificates/me', downloadUserCertificate);

// User routes
router.get('/user/:id/events', getUserEventHistory);

module.exports = router;
