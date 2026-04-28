import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiActivity, FiFilter, FiRefreshCw, FiSearch, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import './AdminSyllabiMonitor.css';

export default function AdminSyllabiMonitor() {
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  const loadAllSyllabi = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/syllabi?status=${statusFilter}`);
      if (!res.ok) throw new Error(`Failed to load syllabi (${res.status})`);
      const data = await res.json();
      setSyllabi(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAllSyllabi();
  }, [loadAllSyllabi]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return syllabi.filter(s => 
      s.curriculumId?.courseTitle?.toLowerCase().includes(q) ||
      s.curriculumId?.courseCode?.toLowerCase().includes(q) ||
      s.facultyId?.lastName?.toLowerCase().includes(q) ||
      s.facultyId?.firstName?.toLowerCase().includes(q) ||
      s.sectionId?.sectionIdentifier?.toLowerCase().includes(q)
    );
  }, [syllabi, search]);

  return (
    <div className="syllabi-monitor-page spec-page">
      <div className="directory-hero admin-hero">
        <div className="directory-hero-icon"><FiActivity /></div>
        <div>
          <p className="directory-hero-title">Syllabi Delivery Monitor</p>
          <p className="directory-hero-subtitle">
            Oversee instructional progress across all active sections and faculty assignments.
          </p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar">
          <div className="search-box monitor-search">
            <FiSearch />
            <input 
              placeholder="Search course, faculty, or section..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <select 
              className="status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Active">Active Only</option>
              <option value="Draft">Drafts Only</option>
              <option value="Archived">Archived Only</option>
              <option value="all">All Statuses</option>
            </select>
            <button className="spec-btn-secondary" onClick={loadAllSyllabi}>
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {error && <div className="spec-alert spec-alert--error">{error}</div>}

        <div className="spec-table-wrap">
          <table className="spec-table monitor-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Instructor</th>
                <th>Section</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="spec-empty">Loading monitor data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="spec-empty">No syllabi found.</td></tr>
              ) : (
                filtered.map((s) => {
                  const lessons = s.weeklyLessons || [];
                  const delivered = lessons.filter(l => l.status === 'Delivered').length;
                  const total = lessons.length;
                  const pct = total > 0 ? Math.round((delivered / total) * 100) : 0;
                  
                  return (
                    <tr key={s._id}>
                      <td>
                        <div className="course-cell">
                          <span className="course-code-small">{s.curriculumId?.courseCode}</span>
                          <span className="course-title-small">{s.curriculumId?.courseTitle}</span>
                        </div>
                      </td>
                      <td>
                        <div className="faculty-cell">
                          <FiUser className="tiny-icon" />
                          <span>{s.facultyId?.lastName}, {s.facultyId?.firstName}</span>
                        </div>
                      </td>
                      <td>{s.sectionId?.sectionIdentifier || '—'}</td>
                      <td>
                        <div className="monitor-progress-wrap">
                          <div className="progress-bar-bg small">
                            <div 
                              className={`progress-bar-fill small ${pct === 100 ? 'done' : pct > 50 ? 'mid' : 'low'}`} 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                          <span className="progress-text-small">{delivered}/{total} ({pct}%)</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${s.status?.toLowerCase()}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/dashboard/instruction/syllabi/${s._id}`} className="spec-btn-secondary btn-sm">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
