import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import '../styles/DashboardLayout.css';

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
    </div>
  );
};

export default DashboardLayout;
