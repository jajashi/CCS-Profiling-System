import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiGrid, FiLayers, FiArrowRight } from 'react-icons/fi';
import MasterScheduleMatrix from '../components/MasterScheduleMatrix';
import './SchedulingDashboard.css';

export default function SchedulingDashboard() {
  const [term, setTerm] = useState('1st Term');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  return (
    <div className="scheduling-dashboard-page">
      <div className="directory-hero faculty-hero scheduling-hero">
        <div className="directory-hero-icon">
          <FiCalendar />
        </div>
        <div>
          <p className="directory-hero-title">Scheduling Matrix</p>
          <p className="directory-hero-subtitle">
            <span>Master timetable view for sections, rooms, and faculty allocations.</span>
          </p>
        </div>
      </div>

      <div className="scheduling-dashboard-toolbar">
        <div className="dashboard-filters">
          <label htmlFor="sched-term">Term</label>
          <select id="sched-term" value={term} onChange={(e) => setTerm(e.target.value)}>
            <option value="1st Term">1st Term</option>
            <option value="2nd Term">2nd Term</option>
            <option value="Summer">Summer</option>
          </select>

          <label htmlFor="sched-ay">Academic Year</label>
          <select id="sched-ay" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
        <div className="quick-actions">
          <Link to="/dashboard/scheduling/sections" className="quick-action-link">
            <FiLayers /> Manage Sections <FiArrowRight size={14} />
          </Link>
          <Link to="/dashboard/scheduling/rooms" className="quick-action-link">
            <FiGrid /> Room Registry <FiArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="dashboard-section matrix-section">
        <h3>Master Schedule Matrix</h3>
        <div className="matrix-wrapper">
          <MasterScheduleMatrix term={term} academicYear={academicYear} />
        </div>
      </div>
    </div>
  );
}
