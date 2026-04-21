const Event = require('../models/Event');
const Room = require('../models/Room');
const Section = require('../models/Section');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');

const createEvent = async (req, res) => {
  try {
    const {
      type,
      schedule,
      isVirtual,
      meetingUrl,
      roomId,
      title,
      organizers,
      targetGroups,
      attachments
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

    if (!isVirtual && roomId) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      // Assuming schedule.date is YYYY-MM-DD, parsing it as UTC gets the exact day
      const dayOfWeek = days[new Date(schedule.date).getUTCDay()]; 

      // Check Events overlap (same date, same room, overlapping times)
      // We look for events that end strictly after our start AND start strictly before our end
      const conflictingEvents = await Event.find({
        roomId,
        isVirtual: false,
        'schedule.date': new Date(schedule.date),
        'schedule.startTime': { $lt: schedule.endTime },
        'schedule.endTime': { $gt: schedule.startTime }
      });

      if (conflictingEvents.length > 0) {
        return res.status(409).json({ message: 'Venue Double-Booked: Overlaps with another event.', conflictingSchedule: 'Another event' });
      }

      // Check Sections overlap
      const sections = await Section.find({ 'schedules.roomId': roomId });
      let hasSectionConflict = false;
      
      for (const section of sections) {
        for (const sched of section.schedules) {
          if (sched.roomId.toString() === roomId.toString() && sched.dayOfWeek === dayOfWeek) {
            if (schedule.startTime < sched.endTime && schedule.endTime > sched.startTime) {
              hasSectionConflict = true;
              break;
            }
          }
        }
        if (hasSectionConflict) break;
      }

      if (hasSectionConflict) {
        return res.status(409).json({ message: 'Venue Double-Booked: Overlaps with an active class schedule.', conflictingSchedule: 'Class Section' });
      }
    }

    // Enforce status server-side based on role
    let eventStatus = 'pending_approval';
    if (req.user && (req.user.role === 'admin' || req.user.role === 'faculty')) {
      eventStatus = 'published';
    }

    const newEvent = new Event({
      type,
      status: eventStatus,
      schedule,
      isVirtual,
      meetingUrl: isVirtual ? meetingUrl : undefined,
      roomId: !isVirtual ? roomId : undefined,
      title,
      organizers,
      targetGroups,
      attachments
    });

    await newEvent.save();

    if (eventStatus === 'published') {
      await dispatchEventNotifications(newEvent);
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error creating event.', error: error.message });
  }
};


const dispatchEventNotifications = async (event) => {
  try {
    let matchedUserIds = new Set();
    const { roles, programs, yearLevels } = event.targetGroups || {};
    
    // 1. Fetch users by role
    if (roles && roles.length > 0) {
      const usersByRole = await User.find({ role: { $in: roles } });
      usersByRole.forEach(u => matchedUserIds.add(u._id.toString()));
    }
    
    // 2. Fetch users by student programs / year levels
    if ((programs && programs.length > 0) || (yearLevels && yearLevels.length > 0)) {
      const studentQuery = {};
      if (programs && programs.length > 0) studentQuery.program = { $in: programs };
      if (yearLevels && yearLevels.length > 0) studentQuery.yearLevel = { $in: yearLevels };
      
      const matchingStudents = await Student.find(studentQuery);
      const studentIds = matchingStudents.map(s => s.id); // Student.id maps to User.studentId
      
      if (studentIds.length > 0) {
        const matchingUsers = await User.find({ studentId: { $in: studentIds } });
        matchingUsers.forEach(u => matchedUserIds.add(u._id.toString()));
      }
    }
    
    if (matchedUserIds.size === 0 && (!roles || roles.length === 0) && (!programs || programs.length === 0) && (!yearLevels || yearLevels.length === 0)) {
      // If targeting is completely open, maybe notify everyone or no one.
      // Assuming 'everyone' if targetGroups is empty
    }

    const notifications = Array.from(matchedUserIds).map(userId => ({
      userId,
      title: `New Event: ${event.title}`,
      message: `${event.title} is scheduled on ${new Date(event.schedule.date).toLocaleDateString()}`,
      link: `/dashboard/events/${event._id}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`Dispatched ${notifications.length} notifications for event ${event._id}`);
    }
  } catch (error) {
    console.error('Error dispatching notifications:', error);
  }
};

const getEvents = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userStudentId = req.user?.studentId;
    
    let studentProgram = null;
    let studentYear = null;
    if (userStudentId) {
      const student = await Student.findOne({ id: userStudentId });
      if (student) {
        studentProgram = student.program;
        studentYear = student.yearLevel;
      }
    }

    // Build the query to filter by targetGroups
    // Events must be 'published' OR I am an organizer OR I am admin/faculty
    // For now purely enforcing ACC-4.2
    
    const events = await Event.find().populate('roomId');
    
    // Filter events server-side based on user match
    const filteredEvents = events.filter(e => {
      // Basic visibility: admins/faculty see all or if I am an organizer
      const isOrganizer = e.organizers.some(org => org.userId.toString() === req.user?._id.toString());
      if (isOrganizer || userRole === 'admin' || userRole === 'faculty') return true;
      if (e.status !== 'published') return false; // Students only see published
      
      const { roles, programs, yearLevels } = e.targetGroups || {};
      const hasTargeting = (roles && roles.length > 0) || (programs && programs.length > 0) || (yearLevels && yearLevels.length > 0);
      
      if (!hasTargeting) return true; // generic audience
      
      let matched = false;
      if (roles && roles.includes(userRole)) matched = true;
      if (programs && programs.includes(studentProgram)) matched = true;
      if (yearLevels && yearLevels.includes(studentYear)) matched = true;
      
      return matched;
    });

    res.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
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

const updateEventStatus = async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    
    // Strict server-side role check
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'faculty')) {
      return res.status(403).json({ message: 'Unauthorized to transition event status.' });
    }

    if (status !== 'published' && status !== 'rejected') {
      return res.status(400).json({ message: 'Invalid status transition. Use published or rejected.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    if (status === 'rejected') {
      event.status = 'draft';
      event.cancelReason = cancelReason;
      await event.save();
      // Notify creator (mock)
      console.log(`Notification sent to creator: Event rejected. Reason: ${cancelReason}`);
      return res.json({ message: 'Event rejected.', event });
    }

    if (status === 'published') {
      event.status = 'published';
      await event.save();
      // Trigger calendar and notification pipeline
      await dispatchEventNotifications(event);
      console.log('Event published and calendar updated.');
      return res.json({ message: 'Event published successfully.', event });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error updating event status.' });
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
  deleteEvent,
  updateEventStatus
};
