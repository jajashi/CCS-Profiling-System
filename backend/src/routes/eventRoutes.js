const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateEventStatus
} = require('../controllers/eventController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

router.use(authenticate);

router.route('/')
  .post(createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEventById)
  .patch(updateEvent)
  .delete(deleteEvent);

router.patch('/:id/status', requireRoles('admin', 'faculty'), updateEventStatus);

module.exports = router;
