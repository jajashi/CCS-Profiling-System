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
        }
      } catch {
        if (isMounted) {
          setStudentCount(null);
          setTotalFacultyCount(null);
          setActiveFacultyCount(null);
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
            <h3 className="stat-value">142</h3> {/* TODO: Replace with actual number of active courses */}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon events">
            <FiActivity />
          </div>
          <div className="stat-details">
            <p className="stat-label">Upcoming Events</p>
            <h3 className="stat-value">5</h3> {/* TODO: Replace with actual number of upcoming events */}
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
              <tr>
                <td><strong>Jane Doe</strong><br/><span className="text-muted text-sm">jane.doe@ccs.edu</span></td>
                <td>Updated profile information</td>
                <td>Student Information</td>
                <td>Today, 10:42 AM</td>
                <td><span className="badge badge-success">Completed</span></td>
              </tr>
              <tr>
                <td><strong>Dr. Smith</strong><br/><span className="text-muted text-sm">smith@ccs.edu</span></td>
                <td>Uploaded new syllabus</td>
                <td>Instruction</td>
                <td>Today, 09:15 AM</td>
                <td><span className="badge badge-success">Completed</span></td>
              </tr>
              <tr>
                <td><strong>System Admin</strong><br/><span className="text-muted text-sm">admin@ccs.edu</span></td>
                <td>Created event "Tech Symposium"</td>
                <td>Events</td>
                <td>Yesterday, 4:30 PM</td>
                <td><span className="badge badge-info">Published</span></td>
              </tr>
              <tr>
                <td><strong>John Marks</strong><br/><span className="text-muted text-sm">j.marks@ccs.edu</span></td>
                <td>Requested schedule change</td>
                <td>Scheduling</td>
                <td>Yesterday, 1:20 PM</td>
                <td><span className="badge badge-warning">Pending</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
