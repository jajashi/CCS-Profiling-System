import React from 'react';

const StudentList = ({ students, loading, pagination, onPageChange, onViewProfile }) => {
  const handlePreviousPage = () => {
    if (pagination.hasPrev) {
      onPageChange(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      onPageChange(pagination.page + 1);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="student-list loading">
        <div className="loading-spinner">Loading students...</div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="student-list empty">
        <div className="empty-state">
          <h3>No students found</h3>
          <p>Try adjusting your filters to see more results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-list">
      <div className="list-header">
        <h3>Student Directory ({pagination.total} total)</h3>
      </div>

      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Program</th>
              <th>Year</th>
              <th>Section</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id} className="student-row">
                <td className="student-id">{student.id}</td>
                <td className="student-name">
                  <div className="name-cell">
                    {student.profileAvatar && (
                      <img 
                        src={student.profileAvatar} 
                        alt={`${student.firstName} ${student.lastName}`}
                        className="student-avatar-small"
                      />
                    )}
                    <span>
                      {student.lastName}, {student.firstName} {student.middleName}
                    </span>
                  </div>
                </td>
                <td className="student-program">{student.program}</td>
                <td className="student-year">{student.yearLevel}</td>
                <td className="student-section">{student.section}</td>
                <td className="student-status">
                  <span className={`status-badge status-${student.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {student.status}
                  </span>
                </td>
                <td className="student-actions">
                  <button
                    onClick={() => onViewProfile(student._id)}
                    className="btn btn-primary btn-sm"
                    disabled={loading}
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} students
          </div>
          
          <div className="pagination-buttons">
            <button
              onClick={handlePreviousPage}
              disabled={!pagination.hasPrev || loading}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            
            <span className="page-indicator">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={!pagination.hasNext || loading}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
