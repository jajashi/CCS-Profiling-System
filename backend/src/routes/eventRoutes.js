const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware'); // assuming standard auth

// If auth is needed: router.use(protect);
// Or we can just build the routes since accept criteria only mention server-side enforcement.

router.route('/')
  .post(createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEventById)
  .patch(updateEvent)
  .delete(deleteEvent);

module.exports = router;
