import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiBriefcase, FiBookOpen, FiCalendar, FiStar, FiLogOut } from 'react-icons/fi';
import { auth } from '../auth';
import logoSrc from '../assets/images/ccs-logo.jpg';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img 
            src={logoSrc} 
            alt="CCS" 
            className="logo-img" 
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
          />
          <span style={{ display: 'none' }} className="text-logo">CCS</span>
        </div>
        <h2 className="brand-name">Profiling System</h2>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <span className="nav-icon"><FiHome /></span>
              <span className="nav-text">Dashboard</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/dashboard/student-info" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <span className="nav-icon"><FiUsers /></span>
              <span className="nav-text">Student Information</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/dashboard/faculty-info" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <span className="nav-icon"><FiBriefcase /></span>
              <span className="nav-text">Faculty Information</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/dashboard/instruction" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <span className="nav-icon"><FiBookOpen /></span>
              <span className="nav-text">Instruction</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/dashboard/scheduling" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <span className="nav-icon"><FiCalendar /></span>
              <span className="nav-text">Scheduling</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/dashboard/events" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <span className="nav-icon"><FiStar /></span>
              <span className="nav-text">Events</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
