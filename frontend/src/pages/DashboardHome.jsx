import React, { useEffect, useState } from 'react';
import { FiUsers, FiBriefcase, FiBookOpen, FiActivity } from 'react-icons/fi';
import '../styles/DashboardHome.css';

const DashboardHome = () => {
  const [studentCount, setStudentCount] = useState(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await fetch('/api/students');
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setStudentCount(data.length);
        }
      } catch {
        if (isMounted) {
          setStudentCount(null);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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
            <p className="stat-label">Total Faculty</p>
            <h3 className="stat-value">84</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon instruction">
            <FiBookOpen />
          </div>
          <div className="stat-details">
            <p className="stat-label">Active Courses</p>
            <h3 className="stat-value">142</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon events">
            <FiActivity />
          </div>
          <div className="stat-details">
            <p className="stat-label">Upcoming Events</p>
            <h3 className="stat-value">5</h3>
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
