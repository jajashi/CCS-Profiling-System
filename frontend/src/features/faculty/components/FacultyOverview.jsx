import React from 'react';
import FacultyCard from './FacultyCard';
import { FiLoader, FiUsers } from 'react-icons/fi';

const FacultyOverview = ({ faculty, loading, isAdmin, onView, onEdit, onToggleStatus }) => {
  if (loading && faculty.length === 0) {
    return (
      <div className="faculty-loading-state">
        <FiLoader className="animate-spin" />
        <p>Loading faculty records...</p>
      </div>
    );
  }

  if (faculty.length === 0) {
    return (
      <div className="faculty-empty-state">
        <FiUsers />
        <p>No faculty members found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="faculty-grid">
      {faculty.map(member => (
        <FacultyCard 
          key={member.employeeId || member._id}
          member={member}
          isAdmin={isAdmin}
          onView={onView}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
};

export default FacultyOverview;
