import React, { useState, useEffect } from 'react';
import { 
  FiBook, FiUsers, FiClock, FiMapPin, FiCalendar, 
  FiChevronRight, FiCheckCircle, FiMoreVertical,
  FiFileText, FiBarChart2
} from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import AttendanceModal from '../components/AttendanceModal';
import RosterModal from '../components/RosterModal';
import MasterScheduleMatrix from '../components/MasterScheduleMatrix';
import toast from 'react-hot-toast';
import './FacultyClassesPage.css';

export default function FacultyClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showRoster, setShowRoster] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'calendar'

  useEffect(() => {
    async function loadMyClasses() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/scheduling/my-classes');
        if (!res.ok) throw new Error("Failed to load classes.");
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadMyClasses();
  }, []);

  const handleViewRoster = (cls) => {
    setSelectedClass(cls);
    setShowRoster(true);
  };

  const handleManageAttendance = (cls) => {
    setSelectedClass(cls);
    setShowAttendance(true);
  };

  return (
    <div className="faculty-classes-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiBook />
        </div>
        <div>
          <p className="directory-hero-title">My Assigned Classes</p>
          <p className="directory-hero-subtitle">
            <span>Manage your teaching load, student rosters, and daily attendance.</span>
          </p>
        </div>
      </div>

      <div className="faculty-toolbar">
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading your classes...</div>
      ) : viewMode === 'calendar' ? (
        <div className="calendar-view-wrapper">
          <MasterScheduleMatrix viewMode="FacultyTime" />
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((cls) => (
            <div key={cls.sectionId} className="class-card">
              <div className="class-card-header">
                <div className="class-code-badge">{cls.courseCode}</div>
                <div className="class-section-id">{cls.sectionIdentifier}</div>
              </div>
              
              <div className="class-card-body">
                <h3 className="class-title">{cls.courseTitle}</h3>
                
                <div className="class-info-item">
                  <FiUsers size={14} />
                  <span><strong>{cls.enrolledCount}</strong> Enrolled Students</span>
                </div>
                
                <div className="class-info-item">
                  <FiCalendar size={14} />
                  <span>{cls.term} | {cls.academicYear}</span>
                </div>
              </div>

              <div className="class-card-footer">
                <button className="class-action-btn" onClick={() => handleViewRoster(cls)}>
                  <FiUsers /> Roster
                </button>
                <button className="class-action-btn primary" onClick={() => handleManageAttendance(cls)}>
                  <FiCheckCircle /> Attendance
                </button>
              </div>
            </div>
          ))}

          {classes.length === 0 && (
            <div className="empty-state-container">
              <FiBook size={48} />
              <h3>No Classes Assigned</h3>
              <p>You don't have any classes assigned for the current term.</p>
            </div>
          )}
        </div>
      )}

      {showRoster && selectedClass && (
        <RosterModal 
          sectionId={selectedClass.sectionId}
          sectionIdentifier={selectedClass.sectionIdentifier}
          onClose={() => {
            setShowRoster(false);
            setSelectedClass(null);
          }}
        />
      )}

      {showAttendance && selectedClass && (
        <AttendanceModal 
          sectionId={selectedClass.sectionId}
          sectionIdentifier={selectedClass.sectionIdentifier}
          courseTitle={selectedClass.courseTitle}
          onClose={() => {
            setShowAttendance(false);
            setSelectedClass(null);
          }}
        />
      )}
    </div>
  );
}
