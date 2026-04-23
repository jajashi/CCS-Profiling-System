import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/** Attendance is now merged into the students roster list. Keep this route for backward compatibility. */
export default function FacultyClassAttendancePage() {
  const { sectionId } = useParams();
  return <Navigate to={`/dashboard/faculty/classes/${encodeURIComponent(sectionId || '')}/students`} replace />;
}
