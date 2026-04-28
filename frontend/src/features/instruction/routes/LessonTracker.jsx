import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiBookOpen, FiCheckCircle, FiClock, FiExternalLink, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import './LessonTracker.css';

export default function LessonTracker() {
  const { user, isFaculty } = useAuth();
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadSyllabi = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // The backend now automatically filters by faculty scope if they are faculty
      const res = await apiFetch('/api/syllabi?status=Active');
      if (!res.ok) {
        throw new Error(`Failed to load syllabi (${res.status})`);
      }
      const data = await res.json();
      setSyllabi(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSyllabi();
  }, [loadSyllabi]);

  const filteredSyllabi = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return syllabi.filter(s => 
      s.curriculumId?.courseTitle?.toLowerCase().includes(q) ||
      s.curriculumId?.courseCode?.toLowerCase().includes(q) ||
      s.sectionId?.sectionIdentifier?.toLowerCase().includes(q)
    );
  }, [syllabi, searchTerm]);

  if (loading) {
    return <div className="spec-loading">Loading tracking data...</div>;
  }

  return (
    <div className="lesson-tracker-page spec-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon"><FiClock /></div>
        <div>
          <p className="directory-hero-title">Lesson Progress Tracking</p>
          <p className="directory-hero-subtitle">
            Monitor and record the delivery of topics across your assigned class sections.
          </p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar">
          <div className="search-box curriculum-search">
            <FiSearch />
            <input 
              placeholder="Search by course or section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="tracker-stats">
            <span className="stat-item">
              <strong>{syllabi.length}</strong> Active Syllabi
            </span>
          </div>
        </div>

        {error && <div className="spec-alert spec-alert--error">{error}</div>}

        <div className="tracker-grid">
          {filteredSyllabi.length === 0 ? (
            <div className="spec-empty">No active syllabi found matching your search.</div>
          ) : (
            filteredSyllabi.map((s) => {
              const lessons = s.weeklyLessons || [];
              const delivered = lessons.filter(l => l.status === 'Delivered').length;
              const total = lessons.length;
              const pct = total > 0 ? Math.round((delivered / total) * 100) : 0;
              
              return (
                <div key={s._id} className="tracker-card">
                  <div className="tracker-card-header">
                    <div className="course-ident">
                      <span className="course-code">{s.curriculumId?.courseCode}</span>
                      <span className="section-tag">{s.sectionId?.sectionIdentifier}</span>
                    </div>
                    <Link to={`/dashboard/instruction/syllabi/${s._id}`} className="view-detail-btn" title="View Syllabus">
                      <FiExternalLink />
                    </Link>
                  </div>
                  <h3 className="course-title">{s.curriculumId?.courseTitle}</h3>
                  
                  <div className="progress-section">
                    <div className="progress-info">
                      <span>{delivered} / {total} Topics Delivered</span>
                      <span className="progress-pct">{pct}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className={`progress-bar-fill ${pct === 100 ? 'done' : pct > 50 ? 'mid' : 'low'}`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>

                  <div className="next-lesson">
                    {delivered < total ? (
                      <>
                        <span className="next-label">NEXT TOPIC:</span>
                        <p className="next-topic">{lessons.find(l => l.status === 'Pending')?.topic || 'N/A'}</p>
                      </>
                    ) : (
                      <div className="completion-badge">
                        <FiCheckCircle /> All Topics Delivered
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
