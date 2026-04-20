import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import ConflictAlertModal from '../Elements/ConflictAlertModal';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { isStudent } = useAuth();
  
  return (
    <div className={`dashboard-container ${isStudent ? 'student-layout' : 'admin-layout'}`}>
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
