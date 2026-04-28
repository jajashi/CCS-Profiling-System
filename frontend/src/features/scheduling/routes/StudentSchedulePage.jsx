import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiClock, FiMapPin, FiUser, FiInfo,
  FiChevronLeft, FiChevronRight, FiGrid
} from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';
import './StudentSchedulePage.css';

export default function StudentSchedulePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classmates, setClassmates] = useState([]);

  useEffect(() => {
    async function loadStudentSchedule() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/scheduling/student-schedule');
        if (!res.ok) throw new Error("Failed to load your schedule.");
        const scheduleData = await res.json();
        setData(scheduleData);

        // Load classmates
        const rosterRes = await apiFetch(`/api/scheduling/sections/${scheduleData.sectionId}/roster`);
        const rosterData = await rosterRes.json();
        setClassmates(rosterData);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStudentSchedule();
  }, []);

  if (loading) {
    return <div className="loading-container">Loading your academic schedule...</div>;
  }

  if (!data) {
    return (
      <div className="student-empty-schedule">
        <FiCalendar size={64} opacity={0.2} />
        <h3>No Section Assigned</h3>
        <p>You are not currently assigned to a block section. Please contact the Registrar.</p>
      </div>
    );
  }

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="student-schedule-page">
      <div className="directory-hero student-hero">
        <div className="directory-hero-icon">
          <FiCalendar />
        </div>
        <div>
          <p className="directory-hero-title">My Class Schedule</p>
          <p className="directory-hero-subtitle">
            <span>Section {data.sectionIdentifier} | {data.program} | {data.yearLevel}</span>
          </p>
        </div>
      </div>

      <div className="student-schedule-grid">
        <div className="main-schedule-col">
          <div className="spec-card schedule-calendar-card">
            <div className="card-header">
              <h3>Weekly Timetable</h3>
              <div className="term-badge">{data.term} AY {data.academicYear}</div>
            </div>
            
            <div className="timetable-container">
              {DAYS.map(day => (
                <div key={day} className="timetable-day-col">
                  <div className="day-header">{day}</div>
                  <div className="day-events">
                    {data.schedules
                      .filter(s => s.dayOfWeek === day)
                      .map((s, idx) => (
                        <div key={idx} className="student-event-card">
                          <div className="event-course">
                            {s.curriculumId?.courseCode || "N/A"}
                          </div>
                          <div className="event-time">
                            <FiClock size={10} /> {s.startTime} - {s.endTime}
                          </div>
                          <div className="event-meta">
                            <span><FiMapPin size={10} /> {s.roomId?.name || "TBA"}</span>
                            <span><FiUser size={10} /> {s.facultyId ? `${s.facultyId.firstName} ${s.facultyId.lastName}` : "TBA"}</span>
                          </div>
                        </div>
                      ))}
                    {data.schedules.filter(s => s.dayOfWeek === day).length === 0 && (
                      <div className="no-classes-msg">No classes</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="side-info-col">
          <div className="spec-card classmates-card">
            <div className="card-header">
              <h3>Classmates</h3>
              <span className="count-badge">{classmates.length}</span>
            </div>
            <div className="classmates-list">
              {classmates.slice(0, 15).map(c => (
                <div key={c._id} className="classmate-item">
                  <div className="classmate-avatar">
                    {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                  </div>
                  <div className="classmate-name">{c.firstName} {c.lastName}</div>
                </div>
              ))}
              {classmates.length > 15 && (
                <div className="more-classmates">and {classmates.length - 15} more...</div>
              )}
            </div>
          </div>

          <div className="spec-card section-info-card">
            <div className="card-header">
              <h3>Section Info</h3>
            </div>
            <div className="info-body">
              <div className="info-row">
                <label>Program:</label>
                <span>{data.program}</span>
              </div>
              <div className="info-row">
                <label>Year Level:</label>
                <span>{data.yearLevel}</span>
              </div>
              <div className="info-row">
                <label>Current Term:</label>
                <span>{data.term}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
