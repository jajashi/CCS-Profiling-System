const { logActivity } = require('./activityLogService');

async function logAudit(req, payload) {
  return logActivity(req, payload);
}

module.exports = { logAudit };
