import React, { useEffect, useState } from 'react';
import { 
  FiUsers, FiBriefcase, FiBookOpen, FiActivity,
  FiAlertCircle, FiCheckCircle, FiDownload, FiEdit2, FiMessageCircle, FiCalendar
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthContext';
import { apiFetch } from '../../../lib/api';
import './DashboardHome.css';

const DashboardHome = () => {
  const { isStudent, isAdmin } = useAuth();
  const [studentCount, setStudentCount] = useState(null);
  const [totalFacultyCount, setTotalFacultyCount] = useState(null);
  const [activeFacultyCount, setActiveFacultyCount] = useState(null);
  const [activeCoursesCount, setActiveCoursesCount] = useState(null);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (isStudent) return undefined;

    let isMounted = true;

    (async () => {
      try {
        const studentRes = await apiFetch('/api/students?limit=1');
        if (!studentRes.ok) throw new Error(`Students request failed: ${studentRes.status}`);
        const studentData = await studentRes.json();

        let facultyAnalytics = null;
        if (isAdmin) {
          const facultyAnalyticsRes = await apiFetch('/api/faculty/analytics');
          if (facultyAnalyticsRes.ok) {
            facultyAnalytics = await facultyAnalyticsRes.json();
          }
        }

        if (isMounted) {
          // Handle paginated response
          const total = studentData.pagination?.total;
          setStudentCount(typeof total === 'number' ? total : (Array.isArray(studentData) ? studentData.length : null));
          if (facultyAnalytics && typeof facultyAnalytics.totalFaculty === 'number') {
            setTotalFacultyCount(facultyAnalytics.totalFaculty);
            setActiveFacultyCount(
              typeof facultyAnalytics.activeFaculty === 'number' ? facultyAnalytics.activeFaculty : null,
            );
          } else {
            setTotalFacultyCount(null);
            setActiveFacultyCount(null);
          }

          const curriculaRes = await apiFetch('/api/curricula?status=Active');
          if (curriculaRes.ok) {
            const curriculaData = await curriculaRes.json();
            setActiveCoursesCount(Array.isArray(curriculaData) ? curriculaData.length : null);
          } else {
            setActiveCoursesCount(null);
          }

          const eventsRes = await apiFetch('/api/events');
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            const now = Date.now();
            const count = Array.isArray(eventsData)
              ? eventsData.filter((event) => {
                  const start = event?.schedule?.startTime ? new Date(event.schedule.startTime).getTime() : NaN;
                  if (!Number.isFinite(start) || start <= now) return false;
                  const status = String(event?.status || '').toLowerCase();
                  return status !== 'cancelled' && status !== 'completed';
                }).length
              : null;
            setUpcomingEventsCount(count);
          } else {
            setUpcomingEventsCount(null);
          }

          const activitiesRes = await apiFetch('/api/dashboard/activities?limit=8');
          if (activitiesRes.ok) {
            const activitiesData = await activitiesRes.json();
            setRecentActivities(Array.isArray(activitiesData.activities) ? activitiesData.activities : []);
          } else {
            setRecentActivities([]);
          }
        }
      } catch {
        if (isMounted) {
          setStudentCount(null);
          setTotalFacultyCount(null);
          setActiveFacultyCount(null);
          setActiveCoursesCount(null);
          setUpcomingEventsCount(null);
          setRecentActivities([]);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isStudent, isAdmin]);

  const [studentSchedule, setStudentSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    if (!isStudent) return;
    setLoadingSchedule(true);
    apiFetch('/api/scheduling/student-schedule')
      .then(res => res.json())
      .then(data => setStudentSchedule(data))
      .catch(() => setStudentSchedule(null))
      .finally(() => setLoadingSchedule(false));
  }, [isStudent]);

  if (isStudent) {
    const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    const todayClasses = studentSchedule?.schedules?.filter(s => s.dayOfWeek === today) || [];

    return (
      <div className="dashboard-home">
        <div className="page-header">
          <h2>Student Dashboard</h2>
          <p className="subtitle">Welcome back! Here's an overview of your academic schedule and status.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon instruction">
              <FiBookOpen />
            </div>
            <div className="stat-details">
              <p className="stat-label">Current Status</p>
              <h3 className="stat-value" style={{ color: '#16a34a' }}>Enrolled</h3>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon users">
              <FiActivity />
            </div>
            <div className="stat-details">
              <p className="stat-label">Section</p>
              <h3 className="stat-value" style={{ fontSize: '1.2rem' }}>{studentSchedule?.sectionIdentifier || 'Assigned'}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon events">
              <FiCheckCircle />
            </div>
            <div className="stat-details">
              <p className="stat-label">Academic Year</p>
              <h3 className="stat-value">{studentSchedule?.academicYear || '2025-2026'}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon faculty">
              <FiCalendar />
            </div>
            <div className="stat-details">
              <p className="stat-label">Term</p>
              <h3 className="stat-value">{studentSchedule?.term || '1st Term'}</h3>
            </div>
          </div>
        </div>

        <div className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', marginTop: '2rem' }}>
          <div className="today-schedule-panel">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Today's Classes</h3>
              <Link to="/dashboard/student/schedule" className="btn btn-sm btn-primary">View Full Schedule</Link>
            </div>
            
            <div className="schedule-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loadingSchedule ? (
                <p>Loading your schedule...</p>
              ) : todayClasses.length > 0 ? (
                todayClasses.map((s, idx) => (
                  <div key={idx} className="today-class-item" style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{s.curriculumId?.courseTitle}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{s.curriculumId?.courseCode} | {s.roomId?.name || 'TBA'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#3b82f6' }}>{s.startTime} - {s.endTime}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.facultyId ? `${s.facultyId.firstName} ${s.facultyId.lastName}` : 'TBA'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                  <p style={{ color: '#64748b' }}>No classes scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

          <div className="recent-activity-col">
             <div className="section-header">
                <h3>Campus Events</h3>
             </div>
             <div style={{ padding: '1rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', textAlign: 'center' }}>
                <FiActivity size={32} color="#9a3412" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem', color: '#7c2d12' }}>Check the Events tab for upcoming campus activities!</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p className="subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <FiUsers />
          </div>
          <div className="stat-details">
            <p className="stat-label">Total Students</p>
            <h3 className="stat-value">{studentCount === null ? '--' : studentCount.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon faculty">
            <FiBriefcase />
          </div>
          <div className="stat-details">
            <p className="stat-label">Active Faculty</p>
            <h3 className="stat-value">
              {activeFacultyCount === null ? '--' : activeFacultyCount.toLocaleString()}
            </h3>
            {/* <p className="stat-sublabel" style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#64748b' }}>
              Total faculty:&nbsp;
              {totalFacultyCount === null ? '—' : totalFacultyCount.toLocaleString()}
            </p> */}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon instruction">
            <FiBookOpen />
          </div>
          <div className="stat-details">
            <p className="stat-label">Active Courses</p>
            <h3 className="stat-value">
              {activeCoursesCount === null ? '--' : activeCoursesCount.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon events">
            <FiActivity />
          </div>
          <div className="stat-details">
            <p className="stat-label">Upcoming Events</p>
            <h3 className="stat-value">
              {upcomingEventsCount === null ? '--' : upcomingEventsCount.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      <div className="recent-activity-section">
        <div className="section-header">
          <h3>Recent Activities</h3>
          <button className="btn btn-primary btn-sm">View All</button>
        </div>
        <div className="table-responsive">
          <table className="activity-table">
            <thead>
              <tr>
                <th>User / Name</th>
                <th>Action</th>
                <th>Module</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length > 0 ? recentActivities.map((row, index) => {
                const statusKey = String(row.status || 'Completed').toLowerCase();
                const badgeClass =
                  statusKey === 'published'
                    ? 'badge-info'
                    : statusKey === 'pending'
                      ? 'badge-warning'
                      : statusKey === 'failed'
                        ? 'badge-danger'
                        : 'badge-success';
                const activityDate = row.createdAt ? new Date(row.createdAt) : null;
                const displayDate = activityDate && !Number.isNaN(activityDate.getTime())
                  ? activityDate.toLocaleString()
                  : '--';
                return (
                  <tr key={`${row.actorIdentifier || row.actorName || 'actor'}-${index}-${row.createdAt || ''}`}>
                    <td>
                      <strong>{row.actorName || 'Unknown'}</strong>
                      <br />
                      <span className="text-muted text-sm">{row.actorIdentifier || '-'}</span>
                    </td>
                    <td>{row.action || '-'}</td>
                    <td>{row.module || '-'}</td>
                    <td>{displayDate}</td>
                    <td><span className={`badge ${badgeClass}`}>{row.status || 'Completed'}</span></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="text-muted text-sm" style={{ textAlign: 'center', padding: '1rem' }}>
                    No recent activities yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
