import React from 'react';

const StudentDirectory = () => {
  return (
    <div className="student-directory">
      <div className="page-header">
        <h2>Student Directory</h2>
        <p className="subtitle">Manage and view all students currently enrolled in the CCS system.</p>
      </div>

      <div className="table-placeholder">
        <div className="empty-state">
          <h3>No students to display</h3>
          <p>This is a skeleton view for the landing page main content area.</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDirectory;
