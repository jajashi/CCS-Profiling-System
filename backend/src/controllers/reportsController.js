const mongoose = require("mongoose");
const Student = require("../models/Student");
const Section = require("../models/Section");
const Event = require("../models/Event");
const Faculty = require("../models/Faculty");
const Curriculum = require("../models/Curriculum");
const Room = require("../models/Room");
const PDFDocument = require("pdfkit");
const { logActivity } = require("../services/activityLogService");

// Get current academic year and term from environment or default values
const CURRENT_ACADEMIC_YEAR = process.env.CURRENT_ACADEMIC_YEAR || "2024-2025";
const CURRENT_TERM = process.env.CURRENT_TERM || "First Semester";

async function getStudentsForReports(req, res, next) {
  try {
    const {
      search,
      program,
      yearLevel,
      section,
      status,
      skill,
      scholarship,
      gender,
      violation,
      facultyId,
      curriculumId,
      eventId,
      academicYear,
      term,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // 1. Basic Student model filters
    if (search && search.trim() !== "") {
      const pattern = new RegExp(search.trim(), "i");
      filter.$or = [
        { id: pattern },
        { firstName: pattern },
        { lastName: pattern },
        { email: pattern },
      ];
    }

    if (program && program.trim() !== "") filter.program = program.trim();
    if (yearLevel && yearLevel.trim() !== "") filter.yearLevel = yearLevel.trim();
    if (status && status.trim() !== "") filter.status = status.trim();
    if (scholarship && scholarship.trim() !== "") filter.scholarship = scholarship.trim();
    if (gender && gender.trim() !== "") filter.gender = gender.trim();
    if (violation && violation.trim() !== "") filter.violation = new RegExp(violation.trim(), "i");

    if (section && section.trim() !== "") {
      const sectionValue = section.trim();
      if (mongoose.Types.ObjectId.isValid(sectionValue)) {
        filter.$or = filter.$or || [];
        filter.$or.push({ sectionId: new mongoose.Types.ObjectId(sectionValue) });
      } else {
        filter.section = sectionValue;
      }
    }

    if (skill && skill.trim() !== "") {
      const skills = Array.isArray(skill)
        ? skill
        : skill.split(",").map((s) => s.trim());
      filter.skills = { $all: skills };
    }

    // 2. Cross-module filters (Faculty, Curriculum, Scheduling)
    const sectionFilter = {};
    if (academicYear) sectionFilter.academicYear = academicYear;
    if (term) sectionFilter.term = term;
    if (facultyId && mongoose.Types.ObjectId.isValid(facultyId)) {
      sectionFilter["schedules.facultyId"] = new mongoose.Types.ObjectId(facultyId);
    }
    if (curriculumId && mongoose.Types.ObjectId.isValid(curriculumId)) {
      sectionFilter["schedules.curriculumId"] = new mongoose.Types.ObjectId(curriculumId);
    }

    // If any section-based filters are active, find matching section IDs
    if (Object.keys(sectionFilter).length > 0) {
      const matchingSections = await Section.find(sectionFilter).select("_id");
      const sectionIds = matchingSections.map((s) => s._id);
      
      if (filter.sectionId) {
        // Intersect if section filter was already set
        if (!sectionIds.some(id => id.equals(filter.sectionId))) {
          return res.status(200).json({ students: [], pagination: { total: 0, page: 1, totalPages: 0 } });
        }
      } else {
        filter.sectionId = { $in: sectionIds };
      }
    }

    // 3. Event attendance filter
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      const event = await Event.findById(eventId).select("attendees.userId");
      if (event) {
        const attendeeUserIds = event.attendees
          .filter(a => a.attended)
          .map(a => a.userId);
        
        const User = mongoose.model("User");
        const users = await User.find({ _id: { $in: attendeeUserIds } }).select("studentId");
        const studentIds = users.map(u => u.studentId).filter(Boolean);
        
        filter.id = { $in: studentIds };
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Student.countDocuments(filter);

    // Fetch paginated students
    const students = await Student.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ id: 1 });

    res.status(200).json({
      students: students.map((doc) => doc.toJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getStudentDossier(req, res, next) {
  try {
    const { id } = req.params;
    const requestingUserRole = req.user?.role;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student identifier" });
    }

    // MongoDB aggregation pipeline for 360-degree view
    const dossier = await Student.aggregate([
      // Stage 1: Match the target student
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },

      // Stage 2: Lookup section details with current term filter
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionDetails",
          pipeline: [
            {
              $match: {
                academicYear: CURRENT_ACADEMIC_YEAR,
                term: CURRENT_TERM,
              },
            },
            {
              $lookup: {
                from: "curricula",
                localField: "schedules.curriculumId",
                foreignField: "_id",
                as: "curriculumDetails",
              },
            },
            {
              $lookup: {
                from: "rooms",
                localField: "schedules.roomId",
                foreignField: "_id",
                as: "roomDetails",
              },
            },
            {
              $lookup: {
                from: "faculty",
                localField: "schedules.facultyId",
                foreignField: "_id",
                as: "facultyDetails",
              },
            },
          ],
        },
      },

      // Stage 3: Get student user ID first, then lookup events
      {
        $lookup: {
          from: "users",
          localField: "id",
          foreignField: "studentId",
          as: "userDoc",
        },
      },
      {
        $lookup: {
          from: "events",
          let: { studentUserId: { $arrayElemAt: ["$userDoc._id", 0] } },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$$studentUserId", "$attendees.userId"] },
                "attendees.attended": true,
                "schedule.date": {
                  $gte: new Date(
                    `${CURRENT_ACADEMIC_YEAR.split("-")[0]}-08-01`,
                  ), // Start of academic year
                  $lte: new Date(
                    `${CURRENT_ACADEMIC_YEAR.split("-")[1]}-05-31`,
                  ), // End of academic year
                },
              },
            },
          ],
          as: "currentTermEvents",
        },
      },

      // Stage 4: Project and shape final output with RBAC
      {
        $project: {
          // Personal Information
          _id: 1,
          id: 1,
          firstName: 1,
          middleName: 1,
          lastName: 1,
          gender: 1,
          dob: 1,
          profileAvatar: 1,

          // Academic Information
          program: 1,
          yearLevel: 1,
          section: 1,
          status: 1,
          scholarship: 1,
          dateEnrolled: 1,

          // Contact Information (visible to all authorized roles)
          email: 1,
          contact: 1,
          guardian: 1,
          guardianContact: 1,

          // Skills (visible to all authorized roles)
          skills: 1,

          // Violation records - RBAC filtered
          violation: {
            $cond: {
              if: { $eq: [requestingUserRole, "admin"] },
              then: "$violation",
              else: "$$REMOVE",
            },
          },

          // Current Schedule Information
          currentSchedule: {
            $arrayElemAt: ["$sectionDetails", 0],
          },

          // Current Term Events
          currentTermEvents: 1,

          // Section ID for reference
          sectionId: 1,
        },
      },

      // Stage 5: Handle null case (student not found)
      {
        $limit: 1,
      },
    ]);

    if (!dossier || dossier.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentDossier = dossier[0];

    // Log the access
    await logActivity(req, {
      action: "Accessed student dossier",
      module: "360-Degree Reporting",
      target: studentDossier.id,
      status: "Completed",
    });

    res.status(200).json(studentDossier);
  } catch (err) {
    next(err);
  }
}

async function exportStudentProfilePDF(req, res, next) {
  try {
    const { id } = req.params;
    const requestingUserRole = req.user?.role;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student identifier" });
    }

    // Get the same dossier data as the web view
    const dossier = await Student.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionDetails",
          pipeline: [
            {
              $match: {
                academicYear: CURRENT_ACADEMIC_YEAR,
                term: CURRENT_TERM,
              },
            },
            {
              $lookup: {
                from: "curricula",
                localField: "schedules.curriculumId",
                foreignField: "_id",
                as: "curriculumDetails",
              },
            },
            {
              $lookup: {
                from: "rooms",
                localField: "schedules.roomId",
                foreignField: "_id",
                as: "roomDetails",
              },
            },
            {
              $lookup: {
                from: "faculty",
                localField: "schedules.facultyId",
                foreignField: "_id",
                as: "facultyDetails",
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "id",
          foreignField: "studentId",
          as: "userDoc",
        },
      },
      {
        $lookup: {
          from: "events",
          let: { studentUserId: { $arrayElemAt: ["$userDoc._id", 0] } },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$$studentUserId", "$attendees.userId"] },
                "attendees.attended": true,
                "schedule.date": {
                  $gte: new Date(`${CURRENT_ACADEMIC_YEAR.split("-")[0]}-08-01`),
                  $lte: new Date(`${CURRENT_ACADEMIC_YEAR.split("-")[1]}-05-31`),
                },
              },
            },
          ],
          as: "currentTermEvents",
        },
      },
      {
        $project: {
          _id: 1,
          id: 1,
          firstName: 1,
          middleName: 1,
          lastName: 1,
          gender: 1,
          dob: 1,
          profileAvatar: 1,
          program: 1,
          yearLevel: 1,
          section: 1,
          status: 1,
          scholarship: 1,
          dateEnrolled: 1,
          email: 1,
          contact: 1,
          guardian: 1,
          guardianContact: 1,
          skills: 1,
          violation: {
            $cond: {
              if: { $eq: [requestingUserRole, "admin"] },
              then: "$violation",
              else: "$$REMOVE",
            },
          },
          currentSchedule: {
            $arrayElemAt: ["$sectionDetails", 0],
          },
          currentTermEvents: 1,
          sectionId: 1,
        },
      },
      {
        $limit: 1,
      },
    ]);

    if (!dossier || dossier.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentData = dossier[0];

    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Student_Profile_${studentData.id}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);

    // PDF Content Generation
    const generatePDFContent = () => {
      let yPosition = 50;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace = 50) => {
        if (yPosition > doc.page.height - 100) {
          doc.addPage();
          yPosition = 50;
        }
      };

      // Header Section
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Student Comprehensive Profile", { align: "center" });
      yPosition += 30;

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Date Generated: ${new Date().toLocaleDateString()}`, {
          align: "center",
        });
      doc.text(`Generated By: ${req.user?.name || "System"}`, {
        align: "center",
      });
      yPosition += 40;

      // Section 1: Identity & Academic Placement
      checkPageBreak(100);
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Section 1: Identity & Academic Placement");
      yPosition += 20;

      doc.fontSize(11).font("Helvetica");
      doc.text(`Student ID: ${studentData.id}`);
      doc.text(
        `Name: ${studentData.firstName} ${studentData.middleName ? studentData.middleName + " " : ""}${studentData.lastName}`,
      );
      doc.text(`Program: ${studentData.program}`);
      doc.text(`Year Level: ${studentData.yearLevel}`);
      doc.text(`Section: ${studentData.section}`);
      doc.text(`Status: ${studentData.status}`);
      if (studentData.scholarship) {
        doc.text(`Scholarship: ${studentData.scholarship}`);
      }
      doc.text(`Date Enrolled: ${studentData.dateEnrolled}`);
      yPosition += 30;

      // Section 2: Contact & Emergency Information
      checkPageBreak(80);
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Section 2: Contact & Emergency Information");
      yPosition += 20;

      doc.fontSize(11).font("Helvetica");
      doc.text(`Student Email: ${studentData.email}`);
      doc.text(`Student Contact: ${studentData.contact}`);
      doc.text(`Guardian: ${studentData.guardian}`);
      doc.text(`Guardian Contact: ${studentData.guardianContact}`);
      yPosition += 30;

      // Section 3: Current Term Schedule
      if (
        studentData.currentSchedule &&
        studentData.currentSchedule.schedules
      ) {
        checkPageBreak(150);
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Section 3: Current Term Schedule");
        yPosition += 20;

        doc.fontSize(11).font("Helvetica");
        studentData.currentSchedule.schedules.forEach((schedule, index) => {
          const curriculum =
            studentData.currentSchedule.curriculumDetails?.find(
              (c) => c._id.toString() === schedule.curriculumId.toString(),
            );
          const room = studentData.currentSchedule.roomDetails?.find(
            (r) => r._id.toString() === schedule.roomId.toString(),
          );
          const faculty = studentData.currentSchedule.facultyDetails?.find(
            (f) => f._id.toString() === schedule.facultyId.toString(),
          );

          doc.text(
            `${index + 1}. ${curriculum?.courseCode || "N/A"} - ${curriculum?.courseTitle || "N/A"}`,
          );
          doc.text(
            `   Room: ${room?.roomNumber || "N/A"} | Faculty: ${faculty?.firstName || "N/A"} ${faculty?.lastName || ""}`,
          );
          doc.text(
            `   Schedule: ${schedule.dayOfWeek} ${schedule.startTime} - ${schedule.endTime}`,
          );
          yPosition += 40;
        });
      }

      // Section 4: Current Term Engagement
      if (
        studentData.currentTermEvents &&
        studentData.currentTermEvents.length > 0
      ) {
        checkPageBreak(100);
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Section 4: Current Term Engagement");
        yPosition += 20;

        doc.fontSize(11).font("Helvetica");
        studentData.currentTermEvents.forEach((event, index) => {
          doc.text(`${index + 1}. ${event.title}`);
          doc.text(
            `   Date: ${new Date(event.schedule.date).toLocaleDateString()}`,
          );
          doc.text(`   Type: ${event.type}`);
          yPosition += 30;
        });
      }

      // Section 5: Administrative Records (Conditional)
      if (requestingUserRole === "admin") {
        checkPageBreak(100);
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Section 5: Administrative Records");
        yPosition += 20;

        doc.fontSize(11).font("Helvetica");

        // Skills
        if (studentData.skills && studentData.skills.length > 0) {
          doc.text("Skills:");
          studentData.skills.forEach((skill) => {
            doc.text(`  • ${skill}`);
          });
          yPosition += 20;
        }

        // Violations
        if (studentData.violation && studentData.violation.trim() !== "") {
          doc.text("Disciplinary Records:");
          doc.text(`  ${studentData.violation}`);
        }
      } else if (studentData.skills && studentData.skills.length > 0) {
        checkPageBreak(80);
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Section 5: Skills & Competencies");
        yPosition += 20;

        doc.fontSize(11).font("Helvetica");
        studentData.skills.forEach((skill) => {
          doc.text(`• ${skill}`);
        });
      }

      // Footer
      doc.fontSize(8).font("Helvetica");
      doc.text("--- End of Profile ---", { align: "center" });
    };

    // Generate the PDF content
    generatePDFContent();

    // Finalize the PDF
    doc.end();

    // Log the export
    await logActivity(req, {
      action: "Exported student profile PDF",
      module: "360-Degree Reporting",
      target: studentData.id,
      status: "Completed",
    });
  } catch (err) {
    next(err);
  }
}

async function getFacultyForReports(req, res, next) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search && search.trim() !== "") {
      const pattern = new RegExp(search.trim(), "i");
      filter.$or = [
        { employeeId: pattern },
        { firstName: pattern },
        { lastName: pattern },
        { email: pattern },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Faculty.countDocuments(filter);
    
    const faculty = await Faculty.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "sections",
          localField: "_id",
          foreignField: "schedules.facultyId",
          as: "teachingAssignments",
          pipeline: [
            { $match: { academicYear: CURRENT_ACADEMIC_YEAR, term: CURRENT_TERM } }
          ]
        }
      },
      { $sort: { lastName: 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    return res.status(200).json({
      faculty: faculty.map(f => ({
        ...f,
        sectionCount: f.teachingAssignments?.length || 0
      })),
      pagination: {
        page: parseInt(page),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getStudentsForReports,
  getStudentDossier,
  exportStudentProfilePDF,
  getFacultyForReports,
};
