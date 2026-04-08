import React from 'react';
import { useAuth } from '../context/AuthContext';

const TopBar = () => {
  const { user, isStudent } = useAuth();
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Can keep empty if sidebar has logo, or add extra nav here */}
      </div>
      
      <div className="topbar-right">
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-role">{user?.role || 'Guest'}</span>
          </div>
          <div className={`user-avatar ${isStudent ? 'student-avatar' : ''}`}>
            {getInitials(user?.name)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
