import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import ConflictAlertModal from '../Elements/ConflictAlertModal';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { isStudent, isFaculty } = useAuth();
  const [welcome, setWelcome] = useState(null);

  const layoutClass = isStudent ? 'student-layout' : isFaculty ? 'faculty-layout' : 'admin-layout';

  useEffect(() => {
    const raw = sessionStorage.getItem('ccs_show_welcome_modal');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setWelcome(parsed || {});
    } catch {
      setWelcome({});
    } finally {
      sessionStorage.removeItem('ccs_show_welcome_modal');
    }
  }, []);

  return (
    <div className={`dashboard-container ${layoutClass}`}>
      <Sidebar />
      <div className="dashboard-main">
        <TopBar />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
      <ConflictAlertModal />
      {welcome ? (
        <div className="welcome-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title">
          <div className="welcome-modal">
            <h2 id="welcome-modal-title">Welcome to CCS Profiling System</h2>
            <p>
              Account setup is complete{welcome?.name ? `, ${welcome.name}` : ''}. You can now access your portal features.
            </p>
            <button type="button" onClick={() => setWelcome(null)}>Continue</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardLayout;
