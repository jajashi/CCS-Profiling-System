import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiGrid, FiLayers, FiArrowRight } from 'react-icons/fi';
import MasterScheduleMatrix from '../components/MasterScheduleMatrix';
import { apiFetch } from '../../../lib/api';
import './SchedulingDashboard.css';

export default function SchedulingDashboard() {
  const [termOptions, setTermOptions] = useState(['1st Term', '2nd Term', 'Summer']);
  const [yearOptions, setYearOptions] = useState(['2024-2025', '2025-2026', '2026-2027']);
  const [term, setTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    apiFetch('/api/scheduling/sections?status=All')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const terms = [...new Set(data.map(s => String(s.term || '').trim()).filter(Boolean))];
          const years = [...new Set(data.map(s => String(s.academicYear || '').trim()).filter(Boolean))];
          if (terms.length > 0) {
            setTermOptions(terms);
            setTerm(terms[0]);
          } else {
            setTerm('1st Term');
          }
          if (years.length > 0) {
            setYearOptions(years.sort((a,b) => b.localeCompare(a)));
            setAcademicYear(years.sort((a,b) => b.localeCompare(a))[0]);
          } else {
            setAcademicYear('2025-2026');
          }
        }
      })
      .catch(() => {
        setTerm('1st Term');
        setAcademicYear('2025-2026');
      });
  }, []);

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
            {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label htmlFor="sched-ay">Academic Year</label>
          <select id="sched-ay" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
             {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
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
