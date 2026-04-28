import React from 'react';

const ScheduleCard = ({ schedule, program }) => {
  if (!schedule || !schedule.schedules || schedule.schedules.length === 0) {
    return (
      <div className="card schedule-card">
        <h3>Current Term Schedule</h3>
        <div className="card-content">
          <p className="no-data">No schedule data available for current term.</p>
        </div>
      </div>
    );
  }

  const getDayName = (dayCode) => {
    const days = {
      'M': 'Monday',
      'T': 'Tuesday', 
      'W': 'Wednesday',
      'Th': 'Thursday',
      'F': 'Friday',
      'S': 'Saturday',
      'Su': 'Sunday'
    };
    return days[dayCode] || dayCode;
  };

  return (
    <div className="card schedule-card">
      <h3>Current Term Schedule</h3>
      <div className="card-content">
        <div className="schedule-header">
          <span className="section-info">
            {schedule.sectionIdentifier} • {program} • Year {schedule.yearLevel}
          </span>
          <span className="term-info">
            {schedule.term} • {schedule.academicYear}
          </span>
        </div>

        <div className="schedule-list">
          {schedule.schedules.map((item, index) => {
            const curriculum = schedule.curriculumDetails?.find(
              c => c._id.toString() === item.curriculumId.toString()
            );
            const room = schedule.roomDetails?.find(
              r => r._id.toString() === item.roomId.toString()
            );
            const faculty = schedule.facultyDetails?.find(
              f => f._id.toString() === item.facultyId.toString()
            );

            return (
              <div key={index} className="schedule-item">
                <div className="schedule-main">
                  <div className="subject-info">
                    <h4>{curriculum?.courseCode || 'N/A'}</h4>
                    <p>{curriculum?.courseTitle || 'Course Title Not Available'}</p>
                  </div>
                  
                  <div className="schedule-details">
                    <div className="detail-item">
                      <label>Time:</label>
                      <span>{getDayName(item.dayOfWeek)} {item.startTime} - {item.endTime}</span>
                    </div>
                    
                    <div className="detail-item">
                      <label>Room:</label>
                      <span>{room?.roomNumber || 'N/A'}</span>
                    </div>
                    
                    <div className="detail-item">
                      <label>Faculty:</label>
                      <span>
                        {faculty?.firstName || 'N/A'} {faculty?.lastName || ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;
