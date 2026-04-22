const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const User = require('../models/User');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * Generate a PDF certificate for an event attendee
 */
const generateCertificate = async (event, user, organizer) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [841.89, 595.28], margin: 50 }); // A4 landscape
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Set up document
      doc.fontSize(24).font('Helvetica-Bold');
      
      // Background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');
      
      // Border
      doc.strokeColor('#2563eb').lineWidth(10);
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
      
      // Header
      doc.fill('#1e40af')
         .fontSize(32)
         .text('Certificate of Participation', { align: 'center' });
      
      // Subtitle
      doc.moveDown(1)
         .fontSize(16)
         .font('Helvetica')
         .fill('#374151')
         .text('This certificate is awarded to', { align: 'center' });
      
      // Student Name
      doc.moveDown(0.5)
         .fontSize(28)
         .font('Helvetica-Bold')
         .fill('#111827')
         .text(user.name || 'Participant', { align: 'center' });
      
      // Event details
      doc.moveDown(1.5)
         .fontSize(14)
         .font('Helvetica')
         .fill('#4b5563')
         .text(`For successfully attending`, { align: 'center' });
      
      doc.moveDown(0.3)
         .fontSize(20)
         .font('Helvetica-Bold')
         .fill('#1f2937')
         .text(event.title, { align: 'center' });
      
      // Date
      const eventDate = new Date(event.schedule.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.moveDown(1)
         .fontSize(14)
         .font('Helvetica')
         .fill('#4b5563')
         .text(`Held on ${eventDate}`, { align: 'center' });
      
      // Footer with organizer
      doc.moveDown(2)
         .fontSize(12)
         .fill('#6b7280')
         .text('Organized by:', { align: 'center' });
      
      doc.moveDown(0.2)
         .fontSize(14)
         .font('Helvetica-Bold')
         .fill('#1f2937')
         .text(organizer?.name || 'Event Organizer', { align: 'center' });
      
      // Date issued
      const issuedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.moveDown(1.5)
         .fontSize(10)
         .fill('#9ca3af')
         .text(`Issued on ${issuedDate}`, { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate certificates for all attendees of an event
 */
const generateEventCertificates = async (eventId) => {
  const Event = require('../models/Event');
  const event = await Event.findById(eventId).populate('organizers.userId');
  
  if (!event) {
    throw new Error('Event not found');
  }

  // Check if attendance is already locked
  if (event.attendanceLocked) {
    throw new Error('Attendance is already locked. Certificates cannot be regenerated.');
  }

  // Get attendees who actually attended
  const attendedUsers = event.attendees.filter(a => a.attended);
  
  if (attendedUsers.length === 0) {
    throw new Error('No attendees with attended: true found');
  }

  // Get user details for all attendees
  const userIds = attendedUsers.map(a => a.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map(u => [String(u._id), u]));

  // Get organizer name
  const organizer = event.organizers?.[0]?.userId;

  // Generate certificates directory
  const certDir = path.join(__dirname, '../../certificates', eventId);
  await mkdir(certDir, { recursive: true });

  const certificates = [];

  // Generate certificate for each attended user
  for (const attendee of attendedUsers) {
    const user = userMap.get(String(attendee.userId));
    if (!user) continue;

    const pdfBuffer = await generateCertificate(event, user, organizer);
    const fileName = `${user.name.replace(/\s+/g, '_')}_${eventId}.pdf`;
    const filePath = path.join(certDir, fileName);
    
    await writeFile(filePath, pdfBuffer);
    certificates.push({
      userId: user._id,
      userName: user.name,
      fileName,
      filePath
    });
  }

  // Lock attendance after certificate generation
  await Event.findByIdAndUpdate(eventId, {
    $set: {
      certificatesGenerated: true,
      certificatesGeneratedAt: new Date(),
      attendanceLocked: true,
      attendanceLockedAt: new Date()
    }
  });

  return certificates;
};

module.exports = {
  generateCertificate,
  generateEventCertificates
};
