import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import ConflictAlertModal from '../Elements/ConflictAlertModal';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { isStudent, isFaculty } = useAuth();

  const layoutClass = isStudent ? 'student-layout' : isFaculty ? 'faculty-layout' : 'admin-layout';

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
    </div>
  );
};

export default DashboardLayout;
