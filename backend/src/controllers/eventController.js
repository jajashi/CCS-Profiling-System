const mongoose = require('mongoose');
const Event = require('../models/Event');
const Room = require('../models/Room');
const Section = require('../models/Section');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');
const { logActivity } = require('../services/activityLogService');

const RSVP_CLOSED_MESSAGE = 'Registration is already closed for this event.';

const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

const eventHasStarted = (event) => {
  if (!event?.schedule?.startTime) return false;
  return new Date(event.schedule.startTime).getTime() <= Date.now();
};

const isRegistrationClosed = (event) => {
  if (!event) return true;
  if (event.rsvpClosed) return true;
  return eventHasStarted(event);
};

const buildTargetingMeta = async (user) => {
  if (!user) return { role: null, program: null, yearLevel: null };
  if (user.role !== 'student' || !user.studentId) {
    return { role: user.role || null, program: null, yearLevel: null };
  }

  const student = await Student.findOne({ id: user.studentId }).lean();
  return {
    role: user.role || null,
    program: student?.program || null,
    yearLevel: student?.yearLevel || null
  };
};

const isUserInTargetGroups = (event, targetingMeta) => {
  const roles = event?.targetGroups?.roles || [];
  const programs = event?.targetGroups?.programs || [];
  const yearLevels = event?.targetGroups?.yearLevels || [];
  const hasTargeting = roles.length > 0 || programs.length > 0 || yearLevels.length > 0;
  if (!hasTargeting) return true;

  const roleMatch = targetingMeta.role ? roles.includes(targetingMeta.role) : false;
  const programMatch = targetingMeta.program ? programs.includes(targetingMeta.program) : false;
  const yearMatch = targetingMeta.yearLevel ? yearLevels.includes(targetingMeta.yearLevel) : false;
  return roleMatch || programMatch || yearMatch;
};

const canUserAccessEvent = (event, user, targetingMeta) => {
  if (!event || !user) return false;
  const isOrganizer = (event.organizers || []).some(
    (org) => String(org.userId) === String(user.id || user._id)
  );
  if (user.role === 'admin' || isOrganizer) return true;
  return isUserInTargetGroups(event, targetingMeta);
};

const computeCapacity = (event) => {
  if (event?.isVirtual) return Number.POSITIVE_INFINITY;
  const roomCapacity = Number(event?.roomId?.maximumCapacity);
  if (!Number.isFinite(roomCapacity) || roomCapacity < 1) return 0;
  return roomCapacity;
};

const mapEventWithViewerState = (event, viewerId) => {
  const eventDoc = typeof event.toObject === 'function' ? event.toObject() : event;
  const attendees = eventDoc.attendees || [];
  const waitlist = eventDoc.waitlist || [];
  const registeredCount = attendees.filter((a) => a.rsvpStatus === 'registered').length;
  const capacity = computeCapacity(eventDoc);
  const isFull = Number.isFinite(capacity) ? registeredCount >= capacity : false;

  const viewerAttendee = attendees.find((a) => String(a.userId?._id || a.userId) === String(viewerId || ''));
  const viewerWaitlistIndex = waitlist.findIndex(
    (w) => String(w.userId?._id || w.userId) === String(viewerId || '')
  );

  return {
    ...eventDoc,
    registration: {
      isClosed: isRegistrationClosed(eventDoc),
      registeredCount,
      capacity: Number.isFinite(capacity) ? capacity : null,
      isFull,
      isRegistered: Boolean(viewerAttendee),
      isWaitlisted: viewerWaitlistIndex >= 0,
      waitlistPosition: viewerWaitlistIndex >= 0 ? viewerWaitlistIndex + 1 : null
    }
  };
};

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
      attachments,
      timezone
    } = req.body;

    // Convert faculty/student IDs to User ObjectIds for organizers
    let processedOrganizers = organizers;
    if (organizers && Array.isArray(organizers)) {
      processedOrganizers = [];
      for (const organizer of organizers) {
        if (organizer.userId) {
          const trimmedId = organizer.userId.trim();
          let user = null;
          
          // Try to find user by employeeId (faculty) first
          user = await User.findOne({ employeeId: trimmedId });
          
          // If not found, try studentId
          if (!user) {
            user = await User.findOne({ studentId: trimmedId });
          }
          
          // If still not found, try username (case insensitive)
          if (!user) {
            user = await User.findOne({ username: trimmedId.toLowerCase() });
          }
          
          // If still not found, try name (case insensitive)
          if (!user) {
            user = await User.findOne({ name: { $regex: new RegExp(`^${trimmedId}$`, 'i') } });
          }
          
          // If still not found, try treating as ObjectId directly
          if (!user) {
            const objectId = toObjectId(trimmedId);
            if (objectId) {
              user = await User.findById(objectId);
            }
          }
          
          if (user) {
            processedOrganizers.push({
              userId: user._id,
              role: organizer.role
            });
          } else {
            return res.status(400).json({ 
              message: `Invalid organizer userId: ${organizer.userId}. User not found.` 
            });
          }
        }
      }
    }

    // Validate schedule
    if (!schedule || !schedule.date || !schedule.startTime || !schedule.endTime) {
      return res.status(400).json({ message: 'Missing schedule details.' });
    }

    const eventDate = new Date(schedule.date);
    const eventStart = new Date(schedule.startTime);
    const eventEnd = new Date(schedule.endTime);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return res.status(400).json({ message: 'Event date must not be in the past.' });
    }

    const [startHour, startMin] = [eventStart.getUTCHours(), eventStart.getUTCMinutes()];
    const [endHour, endMin] = [eventEnd.getUTCHours(), eventEnd.getUTCMinutes()];

    if (eventStart >= eventEnd) {
      return res.status(400).json({ message: 'endTime must be strictly greater than startTime.' });
    }

    if (!isVirtual && roomId) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      // Assuming schedule.date is UTC Datetime mapping back identically
      const dayOfWeek = days[eventStart.getUTCDay()]; 

      // Check Events overlap 
      // events with same room, overlapping times
      const conflictingEvents = await Event.find({
        roomId,
        isVirtual: false,
        'schedule.startTime': { $lt: eventEnd },
        'schedule.endTime': { $gt: eventStart }
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
            // section schedule times are strings like "14:30" representing local wall time. Let's compare as HH:MM strings vs UTC wall clock map or assume standard map
            // Since Event is stored in UTC, and section schedule is string, we should map them back to strings for comparison
            const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
            const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
            
            if (startTimeStr < sched.endTime && endTimeStr > sched.startTime) {
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
      timezone: timezone || 'UTC',
      isVirtual,
      meetingUrl: isVirtual ? meetingUrl : undefined,
      roomId: !isVirtual ? roomId : undefined,
      title,
      organizers: processedOrganizers,
      targetGroups,
      attachments,
      attendees: [],
      waitlist: [],
      rsvpClosed: false
    });

    await newEvent.save();

    if (eventStatus === 'published') {
      await dispatchEventNotifications(newEvent);
    }

    await logActivity(req, {
      action: eventStatus === 'published' ? 'Published event' : 'Created event',
      module: 'Events',
      target: newEvent.title,
      status: eventStatus === 'published' ? 'Published' : 'Pending',
    });

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
    const targetingMeta = await buildTargetingMeta(req.user);
    const events = await Event.find()
      .populate('roomId')
      .populate('organizers.userId', 'name username role');

    const filteredEvents = events
      .filter((event) => {
        // Check if user is an organizer
        const isOrganizer = (event.organizers || []).some(
          (org) => String(org.userId?._id || org.userId) === String(req.user?.id || '')
        );
        
        // Admins and faculty can see all events they're eligible for
        if (req.user?.role === 'admin' || req.user?.role === 'faculty') {
          return canUserAccessEvent(event, req.user, targetingMeta);
        }
        
        // For students and student_leaders, show events they're organizing OR targeted for
        if (isOrganizer || canUserAccessEvent(event, req.user, targetingMeta)) {
          return true;
        }
        
        return false;
      })
      .map((event) => mapEventWithViewerState(event, req.user?.id));

    res.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error fetching events.' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('roomId')
      .populate('organizers.userId', 'name username role')
      .populate('attendees.userId', 'name username role')
      .populate('waitlist.userId', 'name username role');
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const targetingMeta = await buildTargetingMeta(req.user);
    if (!canUserAccessEvent(event, req.user, targetingMeta)) {
      return res.status(403).json({ message: 'You are not allowed to access this event.' });
    }

    res.json(mapEventWithViewerState(event, req.user?.id));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching event.' });
  }
};

const rsvpToEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const event = await Event.findById(id)
      .populate('roomId')
      .populate('organizers.userId', 'name username role');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Enhanced validation with automatic closure
    const validation = validateEventForRSVP(event);
    if (!validation.canRSVP) {
      return res.status(validation.errorCode || 403).json({
        message: validation.error,
        isClosed: true
      });
    }

    // Check if user is in target groups
    const targetingMeta = await buildTargetingMeta(req.user);
    if (!isUserInTargetGroups(event, targetingMeta)) {
      return res.status(403).json({ message: 'You are not eligible to register for this event.' });
    }

    // Check if user is already registered or waitlisted
    const existingAttendee = event.attendees?.find(
      attendee => String(attendee.userId) === String(userId)
    );
    const existingWaitlist = event.waitlist?.find(
      entry => String(entry.userId) === String(userId)
    );

    if (existingAttendee || existingWaitlist) {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }

    // Check capacity and handle waitlist
    const currentAttendees = event.attendees.filter(attendee => !attendee.rsvpStatus || attendee.rsvpStatus === 'registered');
    const roomCapacity = event.roomId?.maximumCapacity;
    const isAtCapacity = roomCapacity && currentAttendees.length >= roomCapacity;

    let updates = {};

    if (isAtCapacity) {
      // Add to waitlist if at capacity
      updates.$push = {
        waitlist: {
          userId: userId,
          addedAt: new Date()
        }
      };
    } else {
      // Add to attendees if not at capacity
      updates.$push = {
        attendees: {
          userId: userId,
          rsvpStatus: 'registered',
          attended: false
        }
      };
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: false }
    );

    if (!updatedEvent) {
      return res.status(500).json({ message: 'Failed to process RSVP.' });
    }

    res.status(201).json({
      message: isAtCapacity ? 'You have been added to the waitlist.' : 'Successfully registered for the event.',
      data: {
        eventId: updatedEvent._id,
        isWaitlisted: isAtCapacity,
        waitlistPosition: isAtCapacity ? event.waitlist.length : null
      }
    });

  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ message: 'Server error processing RSVP.' });
  }
};

const cancelRsvp = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('roomId');
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (isRegistrationClosed(event)) {
      return res.status(403).json({ message: RSVP_CLOSED_MESSAGE });
    }

    const userId = toObjectId(req.user?.id);
    if (!userId) return res.status(401).json({ message: 'Authentication required.' });

    const isAttendee = (event.attendees || []).some((a) => String(a.userId) === String(userId));
    const isWaitlisted = (event.waitlist || []).some((w) => String(w.userId) === String(userId));
    if (!isAttendee && !isWaitlisted) {
      return res.status(404).json({ message: 'No RSVP or waitlist entry found for this user.' });
    }

    const eventId = toObjectId(req.params.id);
    if (!eventId) return res.status(400).json({ message: 'Invalid event id.' });

    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        rsvpClosed: { $ne: true },
        'schedule.startTime': { $gt: new Date() }
      },
      {
        $pull: {
          attendees: { userId },
          waitlist: { userId }
        }
      },
      { new: true }
    )
      .populate('roomId')
      .populate('organizers.userId', 'name username role')
      .populate('attendees.userId', 'name username role')
      .populate('waitlist.userId', 'name username role');

    if (!updatedEvent) {
      return res.status(409).json({ message: 'Cancellation failed. Please retry.' });
    }

    let promotedUserId = null;
    if (isAttendee) {
      let promotionApplied = false;
      while (!promotionApplied) {
        const latest = await Event.findById(eventId).select('waitlist').lean();
        const candidate = latest?.waitlist?.[0]?.userId;
        if (!candidate) break;

        const promoted = await Event.findOneAndUpdate(
          {
            _id: eventId,
            'waitlist.0.userId': candidate,
            rsvpClosed: { $ne: true },
            'schedule.startTime': { $gt: new Date() }
          },
          {
            $push: { attendees: { userId: candidate, rsvpStatus: 'registered', attended: false } },
            $pop: { waitlist: -1 }
          },
          { new: true }
        );

        if (promoted) {
          promotedUserId = candidate;
          promotionApplied = true;
        }
      }
    }

    if (promotedUserId) {
      await Notification.create({
        userId: promotedUserId,
        title: `Spot Opened: ${updatedEvent.title}`,
        message: `You were promoted from waitlist to registered for ${updatedEvent.title}.`,
        link: `/dashboard/events/${updatedEvent._id}`
      });
    }

    const refreshedEvent = await Event.findById(eventId)
      .populate('roomId')
      .populate('organizers.userId', 'name username role')
      .populate('attendees.userId', 'name username role')
      .populate('waitlist.userId', 'name username role');

    return res.status(200).json({
      message: 'RSVP cancelled successfully.',
      event: mapEventWithViewerState(refreshedEvent, req.user.id)
    });
  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    return res.status(500).json({ message: 'Server error while cancelling RSVP.' });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { attended } = req.body;
    if (typeof attended !== 'boolean') {
      return res.status(400).json({ message: '`attended` must be a boolean.' });
    }

    const eventId = toObjectId(req.params.id);
    const attendeeUserId = toObjectId(req.params.userId);
    if (!eventId || !attendeeUserId) {
      return res.status(400).json({ message: 'Invalid id supplied.' });
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        'attendees.userId': attendeeUserId
      },
      {
        $set: {
          'attendees.$.attended': attended
        }
      },
      { new: true }
    )
      .populate('roomId')
      .populate('organizers.userId', 'name username role')
      .populate('attendees.userId', 'name username role')
      .populate('waitlist.userId', 'name username role');

    if (!event) {
      return res.status(404).json({ message: 'Event or attendee not found.' });
    }

    return res.status(200).json({
      message: attended ? 'Marked present.' : 'Marked absent.',
      event: mapEventWithViewerState(event, req.user?.id)
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({ message: 'Server error while updating attendance.' });
  }
};

const autoCloseStartedEventRsvps = async () => {
  const now = new Date();
  try {
    const result = await Event.updateMany(
      {
        rsvpClosed: { $ne: true },
        'schedule.startTime': { $lte: now }
      },
      {
        $set: {
          rsvpClosed: true,
          rsvpClosedAt: now
        }
      }
    );
    return result.modifiedCount || 0;
  } catch (error) {
    console.error('Error while auto-closing RSVP windows:', error);
    return 0;
  }
};

// Enhanced RSVP validation with automatic closure
const validateEventForRSVP = (event) => {
  const now = new Date();

  // Auto-close if event has started - return 403 Forbidden
  if (eventHasStarted(event)) {
    return {
      canRSVP: false,
      error: 'Event has already started. Registration is closed.',
      errorCode: 403,
      isClosed: true
    };
  }

  // Check if registration is already closed
  if (event.rsvpClosed) {
    return {
      canRSVP: false,
      error: 'Registration is closed for this event.',
      errorCode: 403,
      isClosed: true
    };
  }

  return {
    canRSVP: true,
    error: null,
    errorCode: null,
    isClosed: false
  };
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

    await logActivity(req, {
      action: 'Updated event',
      module: 'Events',
      target: event.title,
      status: event.status === 'published' ? 'Published' : 'Completed',
    });
    
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
      await logActivity(req, {
        action: 'Rejected event',
        module: 'Events',
        target: event.title,
        status: 'Completed',
      });
      // Notify creator (mock)
      console.log(`Notification sent to creator: Event rejected. Reason: ${cancelReason}`);
      return res.json({ message: 'Event rejected.', event });
    }

    if (status === 'published') {
      event.status = 'published';
      await event.save();
      // Trigger calendar and notification pipeline
      await dispatchEventNotifications(event);
      await logActivity(req, {
        action: 'Published event',
        module: 'Events',
        target: event.title,
        status: 'Published',
      });
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
    await logActivity(req, {
      action: 'Deleted event',
      module: 'Events',
      target: event.title,
      status: 'Completed',
    });
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting event.' });
  }
};

const getEventAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Calculate analytics manually to avoid aggregation issues
    const totalRsvps = event.attendees?.length || 0;
    const totalWaitlisted = event.waitlist?.length || 0;
    const attended = event.attendees?.filter(a => a.attended).length || 0;
    const notAttended = totalRsvps - attended;
    
    // Calculate waitlist conversions (waitlist users who ended up attending)
    const attendedUserIds = new Set(event.attendees?.filter(a => a.attended).map(a => String(a.userId)));
    const waitlistConversions = event.waitlist?.filter(w => attendedUserIds.has(String(w.userId))).length || 0;
    
    // Calculate rates
    const noShowRate = totalRsvps > 0 ? (notAttended / totalRsvps) * 100 : 0;
    const attendanceRate = totalRsvps > 0 ? (attended / totalRsvps) * 100 : 0;
    const waitlistConversionRate = totalWaitlisted > 0 
      ? (waitlistConversions / totalWaitlisted) * 100 
      : 0;
    
    // Calculate feedback stats
    const feedbackCount = event.feedback?.length || 0;
    const averageRating = feedbackCount > 0 
      ? event.feedback.reduce((sum, f) => sum + f.rating, 0) / feedbackCount 
      : null;

    res.json({
      eventId: event._id,
      title: event.title,
      totalRsvps,
      totalWaitlisted,
      attended,
      notAttended,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      noShowRate: Math.round(noShowRate * 100) / 100,
      waitlistConversions,
      waitlistConversionRate: Math.round(waitlistConversionRate * 100) / 100,
      feedbackCount,
      averageRating: averageRating ? Math.round(averageRating * 100) / 100 : null,
      startTime: event.schedule?.startTime,
      endTime: event.schedule?.endTime,
      certificatesGenerated: event.certificatesGenerated
    });
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    res.status(500).json({ message: 'Server error fetching event analytics.' });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if feedback is enabled for this event
    if (!event.feedbackEnabled) {
      return res.status(403).json({ message: 'Feedback collection is not enabled for this event.' });
    }

    // Check if event has ended
    const now = new Date();
    if (!event.schedule?.endTime || new Date(event.schedule.endTime) > now) {
      return res.status(403).json({ message: 'Feedback can only be submitted after the event has ended.' });
    }

    // Check if user attended the event
    const attendee = event.attendees?.find(a => String(a.userId) === String(userId));
    if (!attendee || !attendee.attended) {
      return res.status(403).json({ message: 'Only attendees can submit feedback for this event.' });
    }

    // Check if user has already submitted feedback
    const existingFeedback = event.feedback?.find(f => String(f.userId) === String(userId));
    if (existingFeedback) {
      return res.status(409).json({ message: 'You have already submitted feedback for this event.' });
    }

    // Add feedback to event
    await Event.findByIdAndUpdate(id, {
      $push: {
        feedback: {
          userId,
          rating,
          comment: comment || '',
          submittedAt: now
        }
      }
    });

    res.json({ message: 'Feedback submitted successfully.' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error submitting feedback.' });
  }
};

const generateCertificates = async (req, res) => {
  try {
    const { id } = req.params;
    const { generateEventCertificates } = require('../services/certificateService');

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if event has ended
    const now = new Date();
    if (!event.schedule?.endTime || new Date(event.schedule.endTime) > now) {
      return res.status(403).json({ message: 'Certificates can only be generated after the event has ended.' });
    }

    // Check if certificates are already generated
    if (event.certificatesGenerated) {
      return res.status(409).json({ message: 'Certificates have already been generated for this event.' });
    }

    // Generate certificates
    const certificates = await generateEventCertificates(id);

    res.json({
      message: `Successfully generated ${certificates.length} certificates`,
      certificatesGenerated: certificates.length,
      certificates: certificates.map(c => ({
        userId: c.userId,
        userName: c.userName
      }))
    });
  } catch (error) {
    console.error('Error generating certificates:', error);
    res.status(500).json({ message: error.message || 'Server error generating certificates.' });
  }
};

const downloadBulkCertificates = async (req, res) => {
  try {
    const { id } = req.params;
    const { generateBulkCertificatesPdf } = require('../services/certificateService');

    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if certificates have been generated
    if (!event.certificatesGenerated) {
      return res.status(403).json({ message: 'Certificates have not been generated yet.' });
    }

    const pdfBuffer = await generateBulkCertificatesPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="event_${id}_certificates.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading bulk certificates:', error);
    res.status(500).json({ message: error.message || 'Server error downloading certificates.' });
  }
};

const downloadUserCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const path = require('path');
    const fs = require('fs');

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const event = await Event.findById(id).populate('organizers.userId');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if certificates have been generated
    if (!event.certificatesGenerated) {
      return res.status(403).json({ message: 'Certificates have not been generated yet.' });
    }

    // Check if user attended the event
    const attendee = event.attendees?.find(a => String(a.userId) === String(userId));
    if (!attendee || !attendee.attended) {
      return res.status(403).json({ message: 'You did not attend this event.' });
    }

    // Get user details
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const certDir = path.join(__dirname, '../../certificates', id);
    const fileName = `${user.name.replace(/\s+/g, '_')}_${id}.pdf`;
    const filePath = path.join(certDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Certificate file not found.' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Error downloading user certificate:', error);
    res.status(500).json({ message: 'Server error downloading certificate.' });
  }
};

const getUserEventHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?.id;

    if (!requestingUserId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Check if the requesting user is the same as the user whose history is being requested
    // or if they're an admin
    if (String(requestingUserId) !== String(id) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'You can only view your own event history.' });
    }

    // Find all events where the user has attended
    const events = await Event.find({
      'attendees.userId': id,
      'attendees.attended': true
    }).populate('roomId', 'name capacity')
      .populate('organizers.userId', 'name')
      .sort({ 'schedule.date': -1 });

    const eventHistory = events.map(event => {
      const attendee = event.attendees.find(a => String(a.userId) === String(id));
      return {
        eventId: event._id,
        title: event.title,
        type: event.type,
        status: event.status,
        date: event.schedule.date,
        startTime: event.schedule.startTime,
        endTime: event.schedule.endTime,
        location: event.isVirtual ? 'Virtual' : event.roomId?.name || 'TBD',
        certificateAvailable: event.certificatesGenerated,
        certificateGeneratedAt: event.certificatesGeneratedAt,
        attended: attendee?.attended || false,
        organizer: event.organizers?.[0]?.userId?.name || 'Unknown'
      };
    });

    res.json({
      userId: id,
      totalEventsAttended: eventHistory.length,
      events: eventHistory
    });
  } catch (error) {
    console.error('Error fetching user event history:', error);
    res.status(500).json({ message: 'Server error fetching event history.' });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  rsvpToEvent,
  cancelRsvp,
  updateAttendance,
  autoCloseStartedEventRsvps,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventAnalytics,
  submitFeedback,
  generateCertificates,
  downloadBulkCertificates,
  downloadUserCertificate,
  getUserEventHistory
}
