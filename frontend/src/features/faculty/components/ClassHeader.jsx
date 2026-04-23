import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';

export default function ClassHeader({ sectionId, section, subtitle, rightAction }) {
  return (
    <div className="directory-hero faculty-hero">
      <div className="directory-hero-icon">
        <FiBookOpen aria-hidden />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="directory-hero-title">{section?.courseCode || 'Class'}</p>
        <p className="directory-hero-subtitle">
          <span>{subtitle}</span>
        </p>
        <p className="faculty-class-header__links">
          <Link to={`/dashboard/faculty/classes/${encodeURIComponent(sectionId || '')}`}>Overview</Link>
          <span aria-hidden>·</span>
          <Link to={`/dashboard/faculty/classes/${encodeURIComponent(sectionId || '')}/students`}>Students & Attendance</Link>
        </p>
      </div>
      {rightAction || null}
    </div>
  );
}
