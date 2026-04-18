const express = require('express');
const {
  listSections,
  listTimeBlocks,
  createTimeBlock,
  updateTimeBlock,
  archiveTimeBlock,
} = require('../controllers/schedulingController');
const { listRooms, createRoom, updateRoom } = require('../controllers/roomController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sections', authenticate, requireRoles('admin', 'faculty'), listSections);

router.get('/timeblocks', authenticate, requireRoles('admin', 'faculty'), listTimeBlocks);
router.post('/timeblocks', authenticate, requireRoles('admin', 'faculty'), createTimeBlock);
router.put('/timeblocks/:id', authenticate, requireRoles('admin', 'faculty'), updateTimeBlock);
router.delete('/timeblocks/:id', authenticate, requireRoles('admin', 'faculty'), archiveTimeBlock);

router.get('/rooms', authenticate, requireRoles('admin', 'faculty'), listRooms);
router.post('/rooms', authenticate, requireRoles('admin', 'faculty'), createRoom);
router.put('/rooms/:id', authenticate, requireRoles('admin', 'faculty'), updateRoom);

module.exports = router;
