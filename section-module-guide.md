# Scheduling & Section Management - Module Guide

This guide provides instructions on how to access, test, and verify the features within the newly implemented Scheduling and Section Management module.

---

## 1. Accessing the Module

### Roles & Permissions
- **Admin**: Full access to all management tools, scheduling, analytics, and lifecycle wizards.
- **Faculty**: Access to "My Classes," student rosters for their assigned subjects, and attendance management.
- **Student**: Access to their personalized "My Schedule" inherited from their assigned section.

### Navigation Paths
- **Admin**: `Sidebar > Scheduling > [Sections | Scheduling Analytics | Scheduling Matrix]`
- **Faculty**: `Sidebar > My Classes` or `Sidebar > My Schedule`
- **Student**: `Sidebar > My Schedule`

---

## 2. Core Feature Workflows (Admin Testing)

### US-001: Create & Manage Sections
1. Navigate to **Scheduling > Manage Sections**.
2. Click **"Create New Section"**.
3. Fill in the identifier (e.g., `BSIT-1A`), Program, and Year Level.
4. **Verification**: 
   - Ensure the section appears in the directory.
   - Check the progress bar (should show 0/55).
   - Duplicate names for the same program/year should be rejected.

### US-004: Mass Enrollment
1. On a Section card, click **"Enroll Students"**.
2. Select students from the directory (use filters/search).
3. Click **"Confirm Enrollment"**.
4. **Verification**:
   - The section's `enrolledCount` should increment.
   - The progress bar should update (Green ≤45, Yellow 46-54, Red 55).
   - Attempt to enroll more than 55 students to verify the hard limit.

### US-007 & US-008: Curriculum Linkage & Scheduling
1. On a Section card (with students enrolled), click **"Assign Resources"**.
2. Select a **Curriculum Subject**.
3. Assign a **Time Block**, **Room**, and **Faculty**.
4. **Verification**:
   - Navigate to **Scheduling Matrix** to see the event plotted.
   - Try assigning the same faculty or room to a conflicting time slot in another section to verify **Conflict Detection**.
   - Note: Resource assignment is disabled for empty sections (US-008).

### US-010: Level-Up Wizard
1. Navigate to **Scheduling Matrix** (Overview).
2. Click **"Level-Up Wizard"** (top right).
3. Select sections eligible for promotion (e.g., all 1st Year sections).
4. Review the "New Identifier" preview (e.g., `BSIT-1A` → `BSIT-2A`).
5. Click **"Execute Promotion"**.
6. **Verification**:
   - Section names and Year Levels should update.
   - Academic Year should increment.
   - Schedules should be cleared for the new term, but student rosters remain intact.

---

## 3. Portal Integration (Role-Based Testing)

### Faculty Portal (US-012, US-014)
1. Log in as a **Faculty** member assigned to at least one section.
2. Go to **My Classes**.
3. **Verification**:
   - Ensure your assigned subjects are visible.
   - Click **"Attendance"** to mark students Present/Absent for today's date.
   - Click **"Roster"** to view student photos and details.

### Student Portal (US-013)
1. Log in as a **Student** enrolled in an active section.
2. Go to **My Schedule**.
3. **Verification**:
   - You should see a weekly timetable inherited from your section.
   - Ensure room numbers and faculty names match what was assigned by the Admin.
   - Check the **Classmates** sidebar to see your cohort.

---

## 4. Analytics & Reporting (US-015, US-016)

1. Navigate to **Scheduling > Scheduling Analytics**.
2. **Verification**:
   - Review the **Utilization Pie Chart** for program distribution.
   - Check the **Capacity Alerts** panel for sections nearing 55 students.
   - Check the **Empty Sections** panel to identify cohorts needing enrollment.
   - Use the **"Export Data"** button to download a JSON snapshot of the analytics.

---

## 5. Technical Verification (API / Database)

If testing via Postman or browser console:
- `GET /api/scheduling/sections`: Returns all active sections with utilization.
- `GET /api/scheduling/matrix`: Returns the flattened schedule for the calendar view.
- `GET /api/scheduling/analytics`: Returns aggregated stats and alerts.
- `GET /api/scheduling/student-schedule`: Returns the specific schedule for the logged-in student.

---
**Module Status**: Production Ready
**Last Updated**: 2026-04-27
