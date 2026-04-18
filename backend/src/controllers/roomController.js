const mongoose = require('mongoose');
const Room = require('../models/Room');

const ROOM_TYPES = Room.TYPE_ENUM;
const ROOM_STATUSES = Room.STATUS_ENUM;

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizeRoomCode(value) {
  return normalizeString(value).toUpperCase();
}

async function listRooms(req, res, next) {
  try {
    const { type, status } = req.query;
    const query = {};

    if (type != null && String(type).trim() !== '') {
      const t = normalizeString(type);
      if (!ROOM_TYPES.includes(t)) {
        return res.status(400).json({
          message: `type must be one of: ${ROOM_TYPES.join(', ')}.`,
        });
      }
      query.type = t;
    }

    if (status != null && String(status).trim() !== '') {
      const s = normalizeString(status);
      if (!ROOM_STATUSES.includes(s)) {
        return res.status(400).json({
          message: `status must be one of: ${ROOM_STATUSES.join(', ')}.`,
        });
      }
      query.status = s;
    }

    const rows = await Room.find(query).sort({ building: 1, roomCode: 1 }).lean();
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function createRoom(req, res, next) {
  try {
    const body = req.body || {};
    const roomCode = normalizeRoomCode(body.roomCode);
    const name = normalizeString(body.name);
    const type = normalizeString(body.type);
    const building = normalizeString(body.building);
    const maximumCapacity = body.maximumCapacity == null ? null : Number(body.maximumCapacity);
    const status = body.status == null ? 'Active' : normalizeString(body.status);

    if (!roomCode) {
      return res.status(400).json({ message: 'roomCode is required.' });
    }
    if (!name) {
      return res.status(400).json({ message: 'name is required.' });
    }
    if (!ROOM_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${ROOM_TYPES.join(', ')}.` });
    }
    if (!Number.isFinite(maximumCapacity) || !Number.isInteger(maximumCapacity) || maximumCapacity < 1) {
      return res.status(400).json({ message: 'maximumCapacity must be an integer >= 1.' });
    }
    if (!building) {
      return res.status(400).json({ message: 'building is required.' });
    }
    if (!ROOM_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${ROOM_STATUSES.join(', ')}.` });
    }

    const created = await Room.create({
      roomCode,
      name,
      type,
      maximumCapacity,
      building,
      status,
    });
    return res.status(201).json(created.toJSON());
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'A room with this room code already exists.' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message || 'Invalid room data.' });
    }
    return next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid room id.' });
    }

    const existing = await Room.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const body = req.body || {};

    if (Object.prototype.hasOwnProperty.call(body, 'roomCode')) {
      const roomCode = normalizeRoomCode(body.roomCode);
      if (!roomCode) return res.status(400).json({ message: 'roomCode cannot be empty.' });
      if (roomCode !== existing.roomCode) {
        const clash = await Room.findOne({ roomCode, _id: { $ne: existing._id } })
          .select('_id')
          .lean();
        if (clash) {
          return res.status(409).json({ message: 'A room with this room code already exists.' });
        }
      }
      existing.roomCode = roomCode;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      const name = normalizeString(body.name);
      if (!name) return res.status(400).json({ message: 'name cannot be empty.' });
      existing.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'type')) {
      const type = normalizeString(body.type);
      if (!ROOM_TYPES.includes(type)) {
        return res.status(400).json({ message: `type must be one of: ${ROOM_TYPES.join(', ')}.` });
      }
      existing.type = type;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'maximumCapacity')) {
      const maximumCapacity = body.maximumCapacity == null ? null : Number(body.maximumCapacity);
      if (!Number.isFinite(maximumCapacity) || !Number.isInteger(maximumCapacity) || maximumCapacity < 1) {
        return res.status(400).json({ message: 'maximumCapacity must be an integer >= 1.' });
      }
      existing.maximumCapacity = maximumCapacity;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'building')) {
      const building = normalizeString(body.building);
      if (!building) return res.status(400).json({ message: 'building cannot be empty.' });
      existing.building = building;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      const status = normalizeString(body.status);
      if (!ROOM_STATUSES.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${ROOM_STATUSES.join(', ')}.` });
      }
      existing.status = status;
    }

    await existing.save();
    return res.status(200).json(existing.toJSON());
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'A room with this room code already exists.' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message || 'Invalid room data.' });
    }
    return next(err);
  }
}

module.exports = {
  listRooms,
  createRoom,
  updateRoom,
};
