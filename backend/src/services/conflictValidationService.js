const Section = require('../models/Section');
const Event = require('../models/Event');
const Faculty = require('../models/Faculty');

/**
 * Normalizes HH:mm time string to minutes from midnight.
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Checks if two time ranges overlap.
 */
function isOverlapping(s1, e1, s2, e2) {
  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Validates room availability.
 * @param {string} roomId
 * @param {string} dayOfWeek
 * @param {string} startTime - HH:mm
 * @param {string} endTime - HH:mm
 * @param {string} academicYear
 * @param {string} term
 * @param {string} excludeSectionId - Optional section ID to ignore (for updates)
 * @param {Date} date - Optional specific date for event-based checks
 */
async function checkRoomConflict(roomId, dayOfWeek, startTime, endTime, academicYear, term, excludeSectionId = null, date = null) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  // 1. Check Section Schedules (Regular classes)
  const query = {
    'schedules.roomId': roomId,
    status: { $ne: 'Archived' },
    _id: { $ne: excludeSectionId },
  };
  if (academicYear) query.academicYear = academicYear;
  if (term) query.term = term;

  const sections = await Section.find(query);

  for (const section of sections) {
    for (const sched of section.schedules) {
      if (sched.roomId.toString() === roomId.toString() && sched.dayOfWeek === dayOfWeek) {
        if (isOverlapping(startMin, endMin, timeToMinutes(sched.startTime), timeToMinutes(sched.endTime))) {
          return {
            conflict: true,
            type: 'Section',
            message: `Room conflict with ${section.sectionIdentifier}: ${sched.dayOfWeek} ${sched.startTime}-${sched.endTime}`,
          };
        }
      }
    }
  }

  // 2. Check Events (One-time or recurring events)
  // For simplicity, we check events on the same date if provided, 
  // or events that might occur on this day of the week (if events had recurring logic, but they don't yet).
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await Event.find({
      roomId,
      status: { $in: ['published', 'pending_approval'] },
      'schedule.date': { $gte: startOfDay, $lte: endOfDay },
    });

    for (const event of events) {
      const eventStart = event.schedule.startTime.getUTCHours() * 60 + event.schedule.startTime.getUTCMinutes();
      const eventEnd = event.schedule.endTime.getUTCHours() * 60 + event.schedule.endTime.getUTCMinutes();
      if (isOverlapping(startMin, endMin, eventStart, eventEnd)) {
        return {
          conflict: true,
          type: 'Event',
          message: `Room conflict with event "${event.title}": ${event.schedule.startTime.toISOString()}`,
        };
      }
    }
  }

  return { conflict: false };
}

/**
 * Validates faculty availability.
 */
async function checkFacultyConflict(facultyId, dayOfWeek, startTime, endTime, academicYear, term, excludeSectionId = null) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  const query = {
    'schedules.facultyId': facultyId,
    status: { $ne: 'Archived' },
    _id: { $ne: excludeSectionId },
  };
  if (academicYear) query.academicYear = academicYear;
  if (term) query.term = term;

  const sections = await Section.find(query);

  for (const section of sections) {
    for (const sched of section.schedules) {
      if (sched.facultyId.toString() === facultyId.toString() && sched.dayOfWeek === dayOfWeek) {
        if (isOverlapping(startMin, endMin, timeToMinutes(sched.startTime), timeToMinutes(sched.endTime))) {
          return {
            conflict: true,
            type: 'Section',
            message: `Faculty conflict with ${section.sectionIdentifier}: ${sched.dayOfWeek} ${sched.startTime}-${sched.endTime}`,
          };
        }
      }
    }
  }

  return { conflict: false };
}

/**
 * Validates cohort availability (to prevent students in the same section having two classes at once).
 */
async function checkCohortConflict(program, yearLevel, sectionIdentifier, dayOfWeek, startTime, endTime, academicYear, term, excludeSectionId = null) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  const query = {
    program,
    yearLevel,
    sectionIdentifier,
    status: { $ne: 'Archived' },
    _id: { $ne: excludeSectionId },
  };
  if (academicYear) query.academicYear = academicYear;
  if (term) query.term = term;

  const sections = await Section.find(query);

  for (const section of sections) {
    for (const sched of section.schedules) {
      if (sched.dayOfWeek === dayOfWeek) {
        if (isOverlapping(startMin, endMin, timeToMinutes(sched.startTime), timeToMinutes(sched.endTime))) {
          return {
            conflict: true,
            type: 'Section',
            message: `Cohort conflict within ${section.sectionIdentifier}: ${sched.dayOfWeek} ${sched.startTime}-${sched.endTime}`,
          };
        }
      }
    }
  }

  return { conflict: false };
}

module.exports = {
  checkRoomConflict,
  checkFacultyConflict,
  checkCohortConflict,
};
