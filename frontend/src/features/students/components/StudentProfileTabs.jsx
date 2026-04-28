import React, { useState } from 'react';
import PersonalTab from './tabs/PersonalTab';
import AcademicTab from './tabs/AcademicTab';
import HealthTab from './tabs/HealthTab';
import HistoryTab from './tabs/HistoryTab';

import { FiUser, FiBook, FiHeart, FiClock } from 'react-icons/fi';

const StudentProfileTabs = ({ student }) => {
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal', icon: <FiUser /> },
    { id: 'academic', label: 'Academic', icon: <FiBook /> },
    { id: 'health', label: 'Health', icon: <FiHeart /> },
    { id: 'history', label: 'History', icon: <FiClock /> }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'personal': return <PersonalTab student={student} />;
      case 'academic': return <AcademicTab student={student} />;
      case 'health': return <HealthTab student={student} />;
      case 'history': return <HistoryTab student={student} />;
      default: return null;
    }
  };

  return (
    <div className="student-profile-tabs">
      <div className="tabs-navigation" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="tab-pane-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default StudentProfileTabs;
