const mongoose = require('mongoose');
const User = require('../models/User');
const PasswordChangeRequest = require('../models/PasswordChangeRequest');
const { logActivity } = require('../services/activityLogService');

/** User submits a request to change their password. */
async function createRequest(req, res) {
  try {
    const { newPassword } = req.body;
    console.log('Creating password change request. req.user:', req.user);
    console.log('req.user.id:', req.user?.id);
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (!req.user?.id) {
      console.error('req.user.id is undefined!');
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('Converted userId:', userId);

    // Check if there is already a pending request
    const existing = await PasswordChangeRequest.findOne({
      userId: userId,
      status: 'Pending',
    });

    if (existing) {
      console.log('User already has a pending request');
      return res.status(400).json({ message: 'You already have a pending password change request.' });
    }

    const request = await PasswordChangeRequest.create({
      userId: userId,
      requestedPassword: newPassword, // Will be hashed by model hook
    });
    console.log('Password change request created:', request);

    await logActivity(req, {
      action: 'Submitted password change request',
      module: 'Account Settings',
      status: 'Completed',
    });

    return res.status(201).json({
      message: 'Password change request submitted successfully. Please wait for admin approval.',
      request,
    });
  } catch (err) {
    console.error('Password change request error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/** Admin lists all pending requests. */
async function getPendingRequests(req, res) {
  try {
    console.log('Fetching pending password change requests...');
    const requests = await PasswordChangeRequest.find({ status: 'Pending' })
      .populate('userId', 'username name role')
      .sort({ createdAt: -1 });
    console.log('Found requests:', requests.length, requests);

    return res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/** Admin approves a request. */
async function approveRequest(req, res) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await PasswordChangeRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is no longer pending.' });
    }

    // Update the User's password directly using updateOne to avoid double-hashing
    await User.updateOne(
      { _id: request.userId },
      { 
        $set: { 
          password: request.requestedPassword,
          mustChangePassword: false 
        } 
      }
    );

    request.status = 'Approved';
    request.adminNotes = adminNotes || '';
    request.approvedBy = new mongoose.Types.ObjectId(req.user.id);
    request.approvedAt = new Date();
    await request.save();

    await logActivity(req, {
      action: 'Approved password change request',
      module: 'Admin Panel',
      target: String(request.userId),
      status: 'Completed',
    });

    return res.status(200).json({ message: 'Password change request approved and applied.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/** Admin rejects a request. */
async function rejectRequest(req, res) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await PasswordChangeRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is no longer pending.' });
    }

    request.status = 'Rejected';
    request.adminNotes = adminNotes || '';
    await request.save();

    await logActivity(req, {
      action: 'Rejected password change request',
      module: 'Admin Panel',
      target: String(request.userId),
      status: 'Completed',
    });

    return res.status(200).json({ message: 'Password change request rejected.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/** User checks status of their own request. */
async function getMyRequests(req, res) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const requests = await PasswordChangeRequest.find({ userId: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json(requests);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getMyRequests,
};
