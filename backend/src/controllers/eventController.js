const Event = require('../models/Event');
const Room = require('../models/Room');

const createEvent = async (req, res) => {
  try {
    const {
      type,
      schedule,
      isVirtual,
      meetingUrl,
      roomId,
      title,
      organizers
    } = req.body;

    // Validate schedule
    if (!schedule || !schedule.date || !schedule.startTime || !schedule.endTime) {
      return res.status(400).json({ message: 'Missing schedule details.' });
    }

    const eventDate = new Date(schedule.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return res.status(400).json({ message: 'Event date must not be in the past.' });
    }

    // Convert times to comparable numbers or objects for validation
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);

    if (startHour > endHour || (startHour === endHour && startMin >= endMin)) {
      return res.status(400).json({ message: 'endTime must be strictly greater than startTime.' });
    }

    // Enforce status server-side
    const newEvent = new Event({
      type,
      status: 'draft', // Ignored client-supplied status
      schedule,
      isVirtual,
      meetingUrl: isVirtual ? meetingUrl : undefined,
      roomId: !isVirtual ? roomId : undefined,
      title,
      organizers
    });

    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error creating event.', error: error.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('roomId');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching events.' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('roomId');
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching event.' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const updates = req.body;
    
    // Role check for status transition
    if (updates.status === 'published' && req.user && req.user.role === 'student_leader') {
      return res.status(403).json({ message: 'Student Leaders cannot self-publish events.' });
    }
    
    if (updates.schedule) {
      const eventDate = new Date(updates.schedule.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        return res.status(400).json({ message: 'Event date must not be in the past.' });
      }

      const [startHour, startMin] = updates.schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = updates.schedule.endTime.split(':').map(Number);

      if (startHour > endHour || (startHour === endHour && startMin >= endMin)) {
        return res.status(400).json({ message: 'endTime must be strictly greater than startTime.' });
      }
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating event.' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting event.' });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
