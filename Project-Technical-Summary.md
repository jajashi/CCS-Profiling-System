# CCS Profiling System - Project Technical Summary

## Overview

The CCS Profiling System is a comprehensive full-stack web application designed for managing student and faculty profiles, academic scheduling, events, and institutional administration within a Computer Science/Computer Studies department. The system provides role-based access control, real-time data management, and integrated workflow automation for educational institutions.

## Technology Stack

### Backend (Node.js/Express)

- **Framework**: Express.js 4.21.2
- **Database**: MongoDB with Mongoose ODM 8.9.5
- **Authentication**: JWT (jsonwebtoken 9.0.3) + bcryptjs 3.0.3
- **File Handling**: Multer 2.1.1 for uploads, PDFKit 0.15.0 for PDF generation
- **Scheduling**: node-cron 3.0.3 for automated tasks
- **Security**: CORS 2.8.6, dotenv 16.4.7
- **Development**: nodemon 3.1.9

### Frontend (React)

- **Framework**: React 19.2.0 with Vite 7.3.1
- **Routing**: React Router DOM 7.13.1
- **Styling**: TailwindCSS 4.2.2 + Vanilla CSS for custom components
- **UI Components**: React Icons 5.6.0, React Hot Toast 2.6.0
- **Data Visualization**: Recharts 2.15.0 (for analytics and dashboards)
- **Calendar**: React Big Calendar 1.19.4
- **Date Handling**: Moment.js 2.30.1
- **Development**: ESLint 9.39.1

## Project Structure

```
CCS-Profiling-System/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── jobs/             # Scheduled tasks
│   │   └── scripts/          # Data seeding scripts
│   ├── uploads/              # File uploads
│   ├── certificates/         # SSL certificates
│   └── package.json
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── features/         # Feature-based modules
│   │   │   ├── accounts/     # Account management
│   │   │   ├── auth/         # Authentication
│   │   │   ├── dashboard/    # Main dashboard
│   │   │   ├── events/       # Event management
│   │   │   ├── faculty/      # Faculty management
│   │   │   ├── instruction/  # Curriculum & syllabus
│   │   │   ├── scheduling/   # Class scheduling (Core Module)
│   │   │   └── students/     # Student management
│   │   ├── lib/              # Utility functions
│   │   ├── providers/        # React context providers
│   │   └── assets/           # Static assets
│   └── package.json
├── templates/                # Email/document templates
├── render.yaml              # Deployment configuration
└── README.md
```

## Core Features & Functionality

### 1. Authentication & Authorization

- **Multi-role System**: Admin, Faculty, Student roles
- **JWT-based Authentication**: Secure token-based session management
- **Password Policies**: Forced password change for new accounts
- **Role-based Access Control**: Granular permissions per user type
- **Account Management**: User creation, activation, and deactivation

### 2. Student Management

- **Profile Management**: Complete student information tracking
  - Personal details (name, contact, guardian info)
  - Academic information (program, year level, section)
  - Skills tracking and violation records
  - Profile avatar uploads
- **Directory Access**: Role-restricted student browsing
  - Students can only view their own profile
  - Faculty/Admin can browse full directory
- **Academic Tracking**: Enrollment status, scholarship information

### 3. Faculty Management

- **Comprehensive Profiles**: Detailed faculty information
  - Employment details (position, type, contract)
  - Academic credentials and certifications
  - Specializations and expertise areas
  - Contact information and emergency contacts
- **Department Organization**: IT/CS department categorization
- **Service Tracking**: Automatic years of service calculation
- **Status Management**: Active/Inactive status with reasons

### 4. Academic Scheduling & Section Management

- **Section Lifecycle**:
  - **Creation**: Establishment of block sections with hard capacity limits (55 students).
  - **Mass Enrollment**: Bulk population of cohorts with real-time capacity validation.
  - **Transfers**: Seamless movement of students between sections with roster synchronization.
  - **Level-Up Wizard**: Automated batch promotion of sections (e.g., 1st Year → 2nd Year) with term reset logic.
  - **Graduation**: Final-year section transitions to "Graduated" status, updating all student records.
- **Resource Allocation**:
  - **Curriculum Linkage**: Assigning multiple subjects/syllabi to a single section.
  - **Conflict-Free Scheduling**: Automated checks for room and faculty overlaps.
  - **Master Matrix**: High-performance calendar view for administrative oversight.
- **Time & Room Management**: Configurable time blocks and physical classroom registry.

### 5. Event Management

- **Event Creation**: Comprehensive event setup
  - Curricular/Extra-curricular categorization
  - Virtual and physical event support
  - Target audience specification (roles, programs, year levels)
  - File attachments and resources
- **Registration System**: RSVP management with waitlisting
  - Automatic waitlist management
  - RSVP deadline enforcement
  - Attendance tracking
- **Approval Workflow**: Event approval process for admins
- **Feedback System**: Post-event rating and comments
- **Certificate Generation**: Automated certificate creation

### 6. Curriculum & Instruction

- **Curriculum Management**: Academic program structures linked to sections.
- **Syllabus Management**: Course content and requirements.
  - Detailed syllabus creation and editing.
  - File attachments and resources.
  - Version control and approval.
- **Instruction Dashboard**: Overview of academic activities.

### 7. Portals (Faculty & Student)

- **Faculty Portal**:
  - **My Classes**: Dashboard for assigned teaching loads.
  - **Attendance Tracking**: Real-time participation management (Present/Absent/Late/Excused).
  - **Roster Drilling**: Direct access to student photos and contact info for assigned cohorts.
- **Student Portal**:
  - **Inherited Schedule**: Personalized timetable automatically synchronized with section assignments.
  - **Cohort View**: Shared visibility of classmates and section progress.
- **Dashboards**: Role-specific home pages with "Today's Schedule" summaries.

### 8. Analytics & Reporting

- **Scheduling Analytics**: Admin dashboard with Recharts-powered visualization.
  - Capacity utilization heatmaps.
  - Program and Year Level distribution charts.
  - Faculty coverage and room utilization statistics.
- **Real-Time Alerts**: Automated warnings for sections nearing capacity (≥50 students) or empty sections.
- **Exporting**: Data portability for historical enrollment patterns and resource reports.

## Data Models & Relationships

### Core Entities

#### User Model

```javascript
{
  username: String (unique),
  password: String (hashed),
  name: String,
  role: ['admin', 'faculty', 'student'],
  isActive: Boolean,
  mustChangePassword: Boolean,
  isNewAccount: Boolean,
  studentId: String (optional, links to Student),
  employeeId: String (optional, links to Faculty)
}
```

#### Student Model

```javascript
{
  id: String (unique),
  firstName: String,
  lastName: String,
  gender: String,
  dob: String,
  program: String,
  yearLevel: String,
  sectionId: ObjectId (ref: Section),
  status: String (e.g., 'Active', 'Graduated'),
  scholarship: String,
  profileAvatar: String,
  email: String,
  contact: String,
  dateEnrolled: String,
  guardian: String,
  guardianContact: String,
  violation: String,
  skills: [String]
}
```

#### Section Model

```javascript
{
  sectionIdentifier: String (unique), // e.g. "BSIT-1A"
  program: String,
  yearLevel: Number,
  academicYear: String,
  term: String,
  capacity: { type: Number, default: 55 },
  currentEnrollmentCount: Number,
  status: ['Active', 'Graduated', 'Archived'],
  schedules: [{
    curriculumId: ObjectId (ref: Curriculum),
    roomId: ObjectId (ref: Room),
    facultyId: ObjectId (ref: Faculty),
    dayOfWeek: String,
    startTime: String,
    endTime: String
  }]
}
```

#### Faculty Model

```javascript
{
  employeeId: String (unique),
  firstName: String,
  lastName: String,
  dob: String,
  department: ['IT', 'CS'],
  profileAvatar: String,
  institutionalEmail: String (unique),
  personalEmail: String,
  mobileNumber: String,
  emergencyContactName: String,
  emergencyContactNumber: String,
  position: String,
  employmentType: ['Full-time', 'Part-time'],
  contractType: String,
  dateHired: String,
  status: ['Active', 'Inactive'],
  inactiveReason: String,
  highestEducation: String,
  fieldOfStudy: String,
  certifications: String,
  specializations: [ObjectId] (ref: Specialization),
  internalNotes: String
}
```

#### Event Model

```javascript
{
  type: ['Curricular', 'Extra-Curricular', 'Other'],
  typeOtherLabel: String,
  status: ['draft', 'pending_approval', 'published', 'cancelled', 'completed'],
  schedule: {
    date: Date,
    startTime: Date,
    endTime: Date
  },
  timezone: String,
  isVirtual: Boolean,
  meetingUrl: String,
  roomId: ObjectId (ref: Room),
  title: String,
  targetGroups: {
    roles: [String],
    programs: [String],
    yearLevels: [String]
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  organizers: [{
    userId: ObjectId (ref: User),
    role: String
  }],
  attendees: [{
    userId: ObjectId (ref: User),
    rsvpStatus: ['registered', 'waitlisted'],
    attended: Boolean
  }],
  waitlist: [{
    userId: ObjectId (ref: User),
    addedAt: Date
  }],
  rsvpClosed: Boolean,
  rsvpClosedAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  feedbackEnabled: Boolean,
  feedback: [{
    userId: ObjectId (ref: User),
    rating: Number (1-5),
    comment: String,
    submittedAt: Date
  }],
  certificatesGenerated: Boolean,
  certificatesGeneratedAt: Date,
  attendanceLocked: Boolean,
  attendanceLockedAt: Date
}
```

### Supporting Models

- **Specialization**: Academic specialization areas
- **Room**: Physical classroom management
- **TimeBlock**: Configurable time periods
- **Curriculum**: Academic program structures
- **Syllabus**: Course content management
- **ActivityLog**: System activity tracking (Audit trail)
- **ClassAttendance**: Daily records for faculty portal
- **Notification**: System-wide notifications

## Data Flow & Architecture

### Request Flow

1. **Client Request**: React SPA sends HTTP request to Express API
2. **Authentication**: JWT token validation via middleware
3. **Authorization**: Role-based access control checks
4. **Business Logic**: Controller processes request, calls services
5. **Data Operations**: Mongoose models interact with MongoDB
6. **Response**: JSON response sent back to client
7. **State Update**: React components update based on response

### Lifecycle Management Flow (Level-Up)

1. **Selection**: Admin selects active sections in the Wizard.
2. **Validation**: System checks eligibility for next level.
3. **Transformation**:
   - `yearLevel` increments.
   - `sectionIdentifier` updates (e.g., -1A to -2A).
   - Previous schedules are cleared for the new term.
4. **Persistence**: Transactional update to database.
5. **Logging**: Full audit trail created in `ActivityLog`.

### Scheduling & Conflict Resolution

1. **Requirement Check**: Enforces student population before scheduling.
2. **Conflict Detection**: Checks for Room/Faculty availability across the entire semester matrix.
3. **Inheritance**: Students automatically inherit the schedule from their assigned `sectionId`.

## API Endpoints Structure

### Authentication (`/api/auth`)

- `POST /login` - User authentication
- `POST /change-password` - Password change

### Students (`/api/students`)

- `GET /` - List students (role-filtered)
- `GET /:id` - Get student details
- `PUT /:id` - Update student information
- `POST /upload-avatar` - Profile image upload

### Faculty (`/api/faculty`)

- `GET /` - List faculty (role-filtered)
- `GET /directory` - Faculty directory
- `GET /directory/:employeeId` - Faculty profile details
- `PUT /directory/:employeeId` - Update faculty information
- `GET /dashboard` - Faculty dashboard data

### Events (`/api/events`)

- `GET /` - List events (user-filtered)
- `POST /` - Create event (admin only)
- `GET /:id` - Get event details
- `PUT /:id/rsvp` - RSVP for event
- `POST /:id/feedback` - Submit feedback
- `POST /:id/approve` - Approve event

### Scheduling (`/api/scheduling`)

- **Management**:
  - `GET /sections` - List active sections
  - `POST /sections` - Create block section
  - `PATCH /sections/:id/roster` - Bulk enrollment/removal
  - `POST /sections/transfer` - Student movement
- **Scheduling**:
  - `PATCH /sections/:id/resources` - Assign Subject/Room/Faculty
  - `GET /matrix` - Master schedule visualization
  - `GET /analytics` - Advanced reporting dashboard
- **Portals**:
  - `GET /my-classes` - Faculty-specific class list
  - `GET /student-schedule` - Personalized student view
  - `PUT /sections/:id/attendance` - Attendance submission

### Instruction (`/api/instruction`)

- `GET /curricula` - List curricula
- `POST /curricula` - Create curriculum
- `GET /syllabi` - List syllabi
- `POST /syllabi` - Create syllabus

### Accounts (`/api/accounts`)

- `GET /` - List user accounts (admin only)
- `POST /` - Create user account
- `PUT /:id/status` - Change account status

## Security Features

### Authentication Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Password Policies**: Forced password changes for security

### Authorization Security

- **Role-based Access**: Granular permissions (Admin vs Faculty vs Student)
- **Route Protection**: Middleware-based guards (`authenticate`, `requireRoles`)
- **Data Isolation**: Students restricted to self-profile and inherited schedules

### Data Security

- **Input Validation**: Schema-based data validation
- **SQL Injection Prevention**: Mongoose ODM protection
- **Environment Variables**: Secure configuration management

## Deployment & Infrastructure

### Development Environment

- **Local Development**: MongoDB local instance
- **Frontend Dev Server**: Vite development server (port 5173)
- **Backend Dev Server**: Express with nodemon (port 5001)

### Production Deployment

- **Render Platform**: Configured for cloud deployment
- **MongoDB Atlas**: Cloud database hosting
- **Static Assets**: Frontend built and deployed as static site
- **API Service**: Backend deployed as Node.js service

## Frontend Architecture

### Component Structure

- **Layout Components**: DashboardLayout, navigation, headers
- **Feature Modules**: Organized by functional area (e.g., `features/scheduling`)
- **State Management**: React context (AuthContext) + local state (useState/useEffect)

### UI/UX Features

- **Responsive Design**: Mobile-friendly interface
- **Toast Notifications**: User feedback system (react-hot-toast)
- **Visualization**: Recharts integration for analytics
- **Interactive Modals**: Multi-step wizards for complex workflows (e.g., Level-Up)

## Conclusion

The CCS Profiling System is a mature educational management platform featuring a robust scheduling engine, comprehensive student/faculty portals, and deep analytical capabilities. By integrating cohort management, resource allocation, and term-end lifecycles into a single cohesive interface, the system significantly reduces administrative overhead and ensures data integrity across the department.

The modular architecture and role-based security provide a scalable foundation for future enhancements, such as automated schedule optimization and real-time communication tools.
