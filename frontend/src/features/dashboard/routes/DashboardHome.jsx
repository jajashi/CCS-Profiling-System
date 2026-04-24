import React, { useEffect, useState } from 'react';
import { 
  FiUsers, FiBriefcase, FiBookOpen, FiActivity,
  FiAlertCircle, FiCheckCircle, FiDownload, FiEdit2, FiMessageCircle 
} from 'react-icons/fi';
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

  if (isStudent) {
    return (
      <div className="dashboard-home">
        <div className="page-header">
          <h2>Student Dashboard</h2>
          <p className="subtitle">Welcome back! Here's an overview of your academic and clearance status.</p>
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
              <p className="stat-label">Program & Year</p>
              <h3 className="stat-value" style={{ fontSize: '1.2rem' }}>BSCS - 2nd Year</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon events">
              <FiCheckCircle />
            </div>
            <div className="stat-details">
              <p className="stat-label">Clearance Status</p>
              <h3 className="stat-value">Cleared</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon faculty">
              <FiAlertCircle />
            </div>
            <div className="stat-details">
              <p className="stat-label">Pending Requirements</p>
              <h3 className="stat-value" style={{ color: '#ef4444' }}>0</h3>
            </div>
          </div>
        </div>

        <div className="recent-activity-section" style={{ 
          marginTop: '2rem', 
          textAlign: 'center', 
          padding: '5rem 2rem', 
          background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)', 
          borderRadius: '24px', 
          border: '2px dashed #fed7aa' 
        }}>
          <div style={{ color: '#9a3412', fontSize: '1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FiActivity style={{ width: '64px', height: '64px', color: '#060403ff', opacity: 0.3, marginBottom: '1.5rem' }} />
            <h3>More features are coming!</h3>
            <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: '#7c2d12', opacity: 0.8 }}>
              Other features are currently being worked on.</p>
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
