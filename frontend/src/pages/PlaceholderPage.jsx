import React from 'react';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="placeholder-page" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px dashed var(--border-color)' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)' }}>This module is currently under construction. Please check back later.</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
