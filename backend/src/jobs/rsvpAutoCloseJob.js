const { autoCloseStartedEventRsvps } = require('../controllers/eventController');

let timer = null;

function startRsvpAutoCloseJob() {
  if (timer) return;

  const run = async () => {
    await autoCloseStartedEventRsvps();
  };

  run();
  timer = setInterval(run, 15 * 1000);
}

module.exports = { startRsvpAutoCloseJob };
