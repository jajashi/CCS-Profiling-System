import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { FiRefreshCw, FiPlus, FiEye, FiEdit2, FiTool } from 'react-icons/fi';
import './EventListPage.css';

export default function EventListPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/api/events');
        
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || 'Failed to fetch events');
        }
      } catch (err) {
        setError(err.message || 'Error fetching events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = !search || 
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.type.toLowerCase().includes(search.toLowerCase()) ||
      (event.isVirtual ? event.meetingUrl : event.roomId?.name || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'All' || event.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || event.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusClass = status === 'published' ? 'status-active' : 
                          status === 'pending_approval' ? 'status-pending' : 'status-archived';
    return <span className={`status-badge ${statusClass}`}>
      {status === 'published' ? 'Published' : 
       status === 'pending_approval' ? 'Pending Approval' : 'Draft'}
    </span>;
  };

  const getVenueInfo = (event) => {
    if (event.isVirtual) {
      return <span className="venue-virtual">Virtual Event</span>;
    }
    return event.roomId?.name || 'No venue assigned';
  };

  if (loading) {
    return (
      <div className="event-registry-container">
        <div className="loading">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-registry-container">
        <div className="spec-alert">{error}</div>
      </div>
    );
  }

  return (
    <div className="event-registry-container">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiTool />
        </div>
        <div>
          <p className="directory-hero-title">Event Registry</p>
          <p className="directory-hero-subtitle">
            <span>
              Manage and view all academic and extracurricular events.
            </span>
          </p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar syllabus-toolbar">
          <div className="spec-toolbar-meta">
            <h2 className="spec-toolbar-title">Events</h2>
            <p className="spec-toolbar-sub">Filter by type and status; search by name, type, or venue.</p>
          </div>
          <div className="spec-toolbar-right">
            {!loading ? (
              <div className="student-count-badge">
                <FiTool />
                <span>
                  {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}
                </span>
              </div>
            ) : null}
            <div className="syllabus-toolbar-actions">
              <button type="button" className="spec-btn-secondary" onClick={() => window.location.reload()}>
                <FiRefreshCw />
                <span>Refresh</span>
              </button>
              <button type="button" className="spec-btn-primary" onClick={() => window.location.href = '/dashboard/events/create'}>
                <FiPlus />
                <span>Create Event</span>
              </button>
            </div>
          </div>
        </div>

        <div className="curriculum-filters-row syllabus-filters-row">
          <div className="search-box curriculum-search">
            <input
              type="text"
              placeholder="Search by event name, type, or venue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <select className="filter-select curriculum-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">All types</option>
            <option value="Curricular">Curricular</option>
            <option value="Extra-Curricular">Extra-Curricular</option>
          </select>
          <select className="filter-select curriculum-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            <option value="published">Published</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {!loading ? (
          <div className="results-count">
            Showing <strong>{filteredEvents.length}</strong> event{filteredEvents.length === 1 ? '' : 's'}
          </div>
        ) : null}

        {error ? <div className="spec-alert">{error}</div> : null}

        <div className="spec-table-wrap">
          <table className="spec-table syllabus-table scheduling-rooms-table">
            <thead>
              <tr>
                <th>EVENT NAME</th>
                <th>TYPE</th>
                <th>DATE</th>
                <th>TIME</th>
                <th>VENUE</th>
                <th>STATUS</th>
                <th className="spec-th-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="spec-loading">
                    Loading events…
                  </td>
                </tr>
              ) : null}
              {!loading && filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="spec-empty">
                    No events match these filters.
                  </td>
                </tr>
              ) : null}
              {!loading && filteredEvents.length > 0 && filteredEvents.map((event) => (
                <tr key={event._id} className="spec-table-row-clickable">
                  <td>{event.title}</td>
                  <td>{event.type}</td>
                  <td>{formatDate(event.schedule?.date)}</td>
                  <td>{formatTime(event.schedule?.startTime)} - {formatTime(event.schedule?.endTime)}</td>
                  <td>{getVenueInfo(event)}</td>
                  <td>{getStatusBadge(event.status)}</td>
                  <td className="spec-td-actions">
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="action-btn view"
                        title="View event"
                        aria-label="View event"
                        onClick={() => window.location.href = `/dashboard/events/${event._id}`}
                      >
                        <FiEye />
                      </button>
                      <button
                        type="button"
                        className="action-btn edit"
                        title="Edit event"
                        aria-label="Edit event"
                        onClick={() => window.location.href = `/dashboard/events/${event._id}/edit`}
                      >
                        <FiEdit2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
