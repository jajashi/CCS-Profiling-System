const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

function normalizeText(value) {
  return String(value ?? '').trim();
}

async function logActivity(req, { action, module, target = '', status = 'Completed', metadata = null }) {
  try {
    if (!req?.user?.id) return;
    if (!['admin', 'faculty'].includes(req.user.role)) return;

    const actorId = req.user.id;
    const user = await User.findById(actorId).select('name employeeId username').lean();

    await ActivityLog.create({
      actorUserId: actorId,
      actorRole: req.user.role,
      actorName: normalizeText(user?.name) || normalizeText(req.user.role).toUpperCase(),
      actorIdentifier: normalizeText(user?.employeeId || user?.username || actorId),
      action: normalizeText(action),
      module: normalizeText(module),
      target: normalizeText(target),
      status: normalizeText(status) || 'Completed',
      metadata,
    });
  } catch (err) {
    // Non-blocking by design: activity logging must not fail business operations.
    console.warn('[activity-log] write failed:', err?.message || err);
  }
}

module.exports = { logActivity };
