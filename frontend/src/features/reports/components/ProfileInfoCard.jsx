import React from 'react';

const ProfileInfoCard = ({ student }) => {
  return (
    <div className="card profile-info-card">
      <h3>Identity & Academic Placement</h3>
      <div className="card-content">
        <div className="profile-header">
          {student.profileAvatar && (
            <img 
              src={student.profileAvatar} 
              alt={`${student.firstName} ${student.lastName}`}
              className="profile-avatar"
            />
          )}
          <div className="profile-basic">
            <h4>{student.lastName}, {student.firstName} {student.middleName}</h4>
            <p className="student-id">ID: {student.id}</p>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <label>Program:</label>
            <span>{student.program}</span>
          </div>
          
          <div className="info-item">
            <label>Year Level:</label>
            <span>{student.yearLevel}</span>
          </div>
          
          <div className="info-item">
            <label>Section:</label>
            <span>{student.section}</span>
          </div>
          
          <div className="info-item">
            <label>Status:</label>
            <span className={`status-badge status-${student.status.toLowerCase()}`}>
              {student.status}
            </span>
          </div>
          
          {student.scholarship && (
            <div className="info-item">
              <label>Scholarship:</label>
              <span>{student.scholarship}</span>
            </div>
          )}
          
          <div className="info-item">
            <label>Date Enrolled:</label>
            <span>{student.dateEnrolled}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
