import React from 'react';
import '../../students/routes/StudentInformation.css';
import MySchedulePortal from '../components/MySchedulePortal';

export default function MySchedulePage() {
  return (
    <div className="student-directory spec-page my-schedule-page">
      <MySchedulePortal />
    </div>
  );
}
