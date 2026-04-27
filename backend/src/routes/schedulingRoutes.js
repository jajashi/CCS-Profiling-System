const express = require('express');
const {
  listSections,
  createSection,
  updateSectionResources,
  getSectionById,
  getScheduleMatrix,
  getRoomUtilization,
  getMyClasses,
  getMySchedule,
  getSectionRoster,
  patchSectionRoster,
  getSectionAttendance,
  upsertSectionAttendance,
  listTimeBlocks,
  createTimeBlock,
  updateTimeBlock,
  archiveTimeBlock,
} = require('../controllers/schedulingController');
const { listRooms, createRoom, updateRoom } = require('../controllers/roomController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sections', authenticate, requireRoles('admin', 'faculty'), listSections);
router.get('/sections/:id', authenticate, requireRoles('admin', 'faculty'), getSectionById);
router.post('/sections', authenticate, requireRoles('admin'), createSection);
router.put('/sections/:id', authenticate, requireRoles('admin'), updateSection);
router.get('/sections/:id/roster', authenticate, requireRoles('admin', 'faculty'), getSectionRoster);
router.patch('/sections/:id/roster', authenticate, requireRoles('admin', 'faculty'), patchSectionRoster);
router.get('/sections/:id/attendance', authenticate, requireRoles('admin', 'faculty'), getSectionAttendance);
router.put('/sections/:id/attendance', authenticate, requireRoles('admin', 'faculty'), upsertSectionAttendance);
router.patch('/sections/:id/resources', authenticate, requireRoles('admin', 'faculty'), updateSectionResources);

router.get('/matrix', authenticate, requireRoles('admin', 'faculty'), getScheduleMatrix);
router.get('/room-utilization', authenticate, requireRoles('admin', 'faculty'), getRoomUtilization);
router.get('/my-classes', authenticate, requireRoles('faculty'), getMyClasses);
router.get('/my-schedule', authenticate, requireRoles('admin', 'faculty'), getMySchedule);

router.get('/timeblocks', authenticate, requireRoles('admin', 'faculty'), listTimeBlocks);
router.post('/timeblocks', authenticate, requireRoles('admin'), createTimeBlock);
router.put('/timeblocks/:id', authenticate, requireRoles('admin'), updateTimeBlock);
router.delete('/timeblocks/:id', authenticate, requireRoles('admin'), archiveTimeBlock);

router.get('/rooms', authenticate, listRooms);
router.post('/rooms', authenticate, requireRoles('admin'), createRoom);
router.put('/rooms/:id', authenticate, requireRoles('admin'), updateRoom);

module.exports = router;
