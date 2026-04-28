import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiLayers, FiGrid, FiArrowRight, FiActivity, FiClock } from 'react-icons/fi';
import './InstructionDashboard.css';

export default function InstructionDashboard() {
  const cards = [
    {
      title: 'Curriculum Catalog',
      description: 'Manage master course frameworks, outcomes, and prerequisite requirements.',
      icon: <FiBookOpen />,
      link: '/dashboard/instruction/curricula',
      color: 'blue'
    },
    {
      title: 'Section Management',
      description: 'Initialize class sections, assign faculty, rooms, and schedule slots.',
      icon: <FiGrid />,
      link: '/dashboard/scheduling/sections',
      color: 'indigo'
    },
    {
      title: 'Syllabus Library',
      description: 'Develop and review course syllabi, lesson plans, and instructional policies.',
      icon: <FiLayers />,
      link: '/dashboard/instruction/syllabi',
      color: 'violet'
    },
    {
      title: 'Lesson Tracking',
      description: 'Faculty portal for recording weekly topic delivery and instructional progress.',
      icon: <FiClock />,
      link: '/dashboard/instruction/tracking',
      color: 'emerald'
    },
    {
      title: 'Syllabi Monitor',
      description: 'Administrative oversight for tracking lesson delivery status across all sections.',
      icon: <FiActivity />,
      link: '/dashboard/instruction/monitor',
      color: 'rose'
    }
  ];

  return (
    <div className="instruction-dashboard-page">
      <div className="directory-hero instruction-hero">
        <div className="directory-hero-icon"><FiActivity /></div>
        <div>
          <p className="directory-hero-title">Instructional Command Center</p>
          <p className="directory-hero-subtitle">Streamlined management of academic frameworks, section logistics, and syllabus development.</p>
        </div>
      </div>

      <div className="instruction-hub-grid">
        {cards.map(card => (
          <Link to={card.link} key={card.title} className={`hub-card hub-card--${card.color}`}>
            <div className="hub-card-icon">{card.icon}</div>
            <div className="hub-card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className="hub-card-footer">
                <span>Manage {card.title.split(' ')[0]}</span>
                <FiArrowRight />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="instruction-info-section">
        <div className="info-card">
          <div className="info-icon"><FiClock /></div>
          <div className="info-text">
            <h4>Streamlined Workflow</h4>
            <p>Did you know? You can now create a Syllabus directly from the Section Management page. We've pre-filled the course and faculty details for you to save time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
