import React from 'react';

const GuardianInfoCard = ({ student }) => {
  return (
    <div className="card guardian-info-card">
      <h3>Contact & Emergency Information</h3>
      <div className="card-content">
        <div className="contact-section">
          <h4>Student Contact</h4>
          <div className="info-grid">
            <div className="info-item">
              <label>Email:</label>
              <span>{student.email || 'Not provided'}</span>
            </div>
            
            <div className="info-item">
              <label>Phone:</label>
              <span>{student.contact || 'Not provided'}</span>
            </div>
          </div>
        </div>

        <div className="guardian-section">
          <h4>Guardian/Emergency Contact</h4>
          <div className="info-grid">
            <div className="info-item">
              <label>Guardian Name:</label>
              <span>{student.guardian || 'Not provided'}</span>
            </div>
            
            <div className="info-item">
              <label>Guardian Contact:</label>
              <span>{student.guardianContact || 'Not provided'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianInfoCard;
