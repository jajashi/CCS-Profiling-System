const ActivityLog = require('../models/ActivityLog');
const Student = require('../models/Student');

async function getRecentActivities(req, res, next) {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;
    const skip = (page - 1) * limit;

    const { module, status, search } = req.query;
    const query = {};

    if (req.user?.role === 'faculty') {
      query.actorUserId = req.user.id;
    }

    if (module && module !== 'All') query.module = module;
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { actorName: { $regex: search, $options: 'i' } },
        { actorIdentifier: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { target: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await ActivityLog.countDocuments(query);
    const rows = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
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
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function getAnalyticsSummary(req, res, next) {
  try {
    const programDistribution = await Student.aggregate([
      { $group: { _id: "$program", count: { $sum: 1 } } }
    ]);

    const activityTrend = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const yearLevelDistribution = await Student.aggregate([
      { $group: { _id: "$yearLevel", count: { $sum: 1 } } },
      { $sort: { "_id": 1 } }
    ]);

    return res.status(200).json({
      programDistribution: programDistribution.map(d => ({ name: d._id || 'Unassigned', value: d.count })),
      yearLevelDistribution: yearLevelDistribution.map(d => ({ name: d._id || 'Unassigned', value: d.count })),
      activityTrend: activityTrend.map(d => ({ date: d._id, count: d.count }))
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getRecentActivities, getAnalyticsSummary };
