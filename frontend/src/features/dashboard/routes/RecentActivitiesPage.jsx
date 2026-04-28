import React, { useEffect, useState, useCallback } from 'react';
import { 
  FiActivity, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiRefreshCw, FiClock
} from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import './RecentActivitiesPage.css';

const PAGE_SIZE = 20;

const RecentActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        search,
        module: moduleFilter,
        status: statusFilter
      });
      
      const res = await apiFetch(`/api/dashboard/activities?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      
      const data = await res.json();
      setActivities(data.activities || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalRecords(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, moduleFilter, statusFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleModuleChange = (e) => {
    setModuleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const modules = ['All', 'Accounts', 'Students', 'Faculty', 'Instruction', 'Scheduling', 'Events', 'System'];
  const statuses = ['All', 'Completed', 'Failed', 'Pending', 'Published'];

  return (
    <div className="recent-activities-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiActivity />
        </div>
        <div>
          <p className="directory-hero-title">System Audit Log</p>
          <p className="directory-hero-subtitle">Review recent administrative actions and system events across all modules.</p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar">
          <div className="search-box curriculum-search">
            <FiSearch />
            <input 
              type="text" 
              placeholder="Search by user, action, or target..." 
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="toolbar-actions">
            <div className="filter-group">
              <select value={moduleFilter} onChange={handleModuleChange} className="filter-select">
                {modules.map(m => <option key={m} value={m}>{m} Module</option>)}
              </select>
              <select value={statusFilter} onChange={handleStatusChange} className="filter-select">
                {statuses.map(s => <option key={s} value={s}>{s} Status</option>)}
              </select>
            </div>
            <button className="spec-btn-secondary" onClick={() => fetchActivities()}>
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {error && <div className="spec-alert spec-alert--error">{error}</div>}

        <div className="spec-table-wrap">
          <table className="spec-table">
            <thead>
              <tr>
                <th>USER / IDENTIFIER</th>
                <th>ACTION</th>
                <th>MODULE</th>
                <th>TARGET</th>
                <th>DATE & TIME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="spec-loading">Loading activity logs...</td></tr>
              ) : activities.length > 0 ? (
                activities.map((row, index) => {
                  const statusKey = String(row.status || 'Completed').toLowerCase();
                  const badgeClass = 
                    statusKey === 'published' ? 'status-active' : 
                    statusKey === 'pending' ? 'status-pending' : 
                    statusKey === 'failed' ? 'status-inactive' : 'status-active';
                  
                  return (
                    <tr key={`${index}-${row.createdAt}`}>
                      <td>
                        <div className="actor-cell">
                          <strong>{row.actorName}</strong>
                          <span className="actor-id">{row.actorIdentifier}</span>
                        </div>
                      </td>
                      <td>{row.action}</td>
                      <td><span className="module-tag">{row.module}</span></td>
                      <td>{row.target}</td>
                      <td>
                        <div className="date-cell">
                          <FiClock />
                          <span>{new Date(row.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td><span className={`status-badge ${badgeClass}`}>{row.status}</span></td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" className="spec-empty">No activities found matching your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-footer">
          <div className="record-count">
            Showing {activities.length} of {totalRecords} activities
          </div>
          <div className="pagination-controls">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="pagination-btn"
            >
              <FiChevronLeft />
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="pagination-btn"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivitiesPage;
