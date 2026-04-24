const ActivityLog = require('../models/ActivityLog');

async function getRecentActivities(req, res, next) {
  try {
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

    const query = {};
    if (req.user?.role === 'faculty') {
      query.actorUserId = req.user.id;
    }

    const rows = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('actorName actorIdentifier action module target status createdAt')
      .lean();

    return res.status(200).json({
      activities: rows.map((row) => ({
        actorName: row.actorName || 'Unknown',
        actorIdentifier: row.actorIdentifier || '',
        action: row.action || '',
        module: row.module || '',
        target: row.target || '',
        status: row.status || 'Completed',
        createdAt: row.createdAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getRecentActivities };
