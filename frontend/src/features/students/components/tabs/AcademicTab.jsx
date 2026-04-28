import React from 'react';

const AcademicTab = ({ student }) => {
  return (
    <div className="profile-tab-content">
      <div className="profile-section">
        <h4 className="section-title">Academic Records</h4>
        <div className="modal-grid">
          <div>
            <p className="label">Program / Course</p>
            <input className="readonly-field" type="text" value={student.program || ''} readOnly />
          </div>
          <div>
            <p className="label">Year Level</p>
            <input className="readonly-field" type="text" value={student.yearLevel || ''} readOnly />
          </div>
          <div>
            <p className="label">Current Section</p>
            <input className="readonly-field" type="text" value={student.section || ''} readOnly />
          </div>
          <div>
            <p className="label">Enrollment Status</p>
            <input className="readonly-field" type="text" value={student.status || ''} readOnly />
          </div>
          <div>
            <p className="label">Student Type</p>
            <input className="readonly-field" type="text" value={student.studentType || 'Regular'} readOnly />
          </div>
          <div>
            <p className="label">Scholarship / Grant</p>
            <input className="readonly-field" type="text" value={student.scholarship || 'None'} readOnly />
          </div>
          <div>
            <p className="label">Date of Initial Enrollment</p>
            <input className="readonly-field" type="text" value={student.dateEnrolled || ''} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicTab;
