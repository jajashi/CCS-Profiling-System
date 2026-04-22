const cron = require('node-cron');
const Event = require('../models/Event');

/**
 * Scheduled job to automatically close RSVP registration for events
 * that have reached their start time. Runs every minute.
 */
const startRsvpAutoCloseJob = () => {
  console.log('Starting RSVP auto-close scheduled job...');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Find events that:
      // - Have started (startTime <= now)
      // - Are not already closed for RSVP
      // - Are not cancelled
      const eventsToClose = await Event.find({
        'schedule.startTime': { $lte: now },
        rsvpClosed: false,
        status: { $ne: 'cancelled' }
      });
      
      if (eventsToClose.length === 0) {
        return; // No events to close
      }
      
      console.log(`Found ${eventsToClose.length} events to close RSVP for`);
      
      // Close RSVP for all eligible events
      const result = await Event.updateMany(
        {
          _id: { $in: eventsToClose.map(e => e._id) },
          rsvpClosed: false
        },
        {
          $set: {
            rsvpClosed: true,
            rsvpClosedAt: now
          }
        }
      );
      
      console.log(`Successfully closed RSVP for ${result.modifiedCount} events`);
      
    } catch (error) {
      console.error('Error in RSVP auto-close job:', error);
    }
  });
  
  console.log('RSVP auto-close scheduled job started (runs every minute)');
};

module.exports = { startRsvpAutoCloseJob };
