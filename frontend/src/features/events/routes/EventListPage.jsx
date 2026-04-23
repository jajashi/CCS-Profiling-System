import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { FiRefreshCw, FiPlus, FiEye, FiEdit2, FiTool, FiX, FiTrash2, FiBarChart2, FiUsers, FiDownload, FiAward, FiStar, FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import EventCreationForm from '../components/EventCreationForm';
import './EventListPage.css';

export default function EventListPage() {
  const PAGE_SIZE = 20;
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [activeEvent, setActiveEvent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [viewTab, setViewTab] = useState('details');
  const [viewReport, setViewReport] = useState(null);
  const [viewReportLoading, setViewReportLoading] = useState(false);
  const [viewReportError, setViewReportError] = useState('');
  const [generatingCertificates, setGeneratingCertificates] = useState(false);
  const [attendanceSavingUserId, setAttendanceSavingUserId] = useState(null);
  const [attendanceUpdateError, setAttendanceUpdateError] = useState('');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const canManageEvents = user?.role === 'admin' || user?.role === 'faculty';

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/events');
      
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        setError(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to fetch events');
      }
    } catch (err) {
      setError(err.message || 'Error fetching events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const openEventId = location.state?.openEventId;
    if (!openEventId) return;

    handleOpenViewModal(openEventId);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

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
      (event.type === 'Other' ? (event.typeOtherLabel || 'Other') : event.type).toLowerCase().includes(search.toLowerCase()) ||
      (event.isVirtual ? event.meetingUrl : event.roomId?.name || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'All' || event.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || event.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  const totalPages = Math.max(Math.ceil(filteredEvents.length / PAGE_SIZE), 1);
  const paginatedEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPageInput(String(page || 1));
  }, [page]);

  const handlePageJump = () => {
    const parsed = Number.parseInt(String(pageInput || '').trim(), 10);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(page || 1));
      return;
    }
    const nextPage = Math.min(Math.max(parsed, 1), Math.max(totalPages || 1, 1));
    setPageInput(String(nextPage));
    if (nextPage !== page) {
      setPage(nextPage);
    }
  };

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
      return <span className="venue-virtual">Online/Virtual</span>;
    }
    return event.roomId?.name || 'No venue assigned';
  };

  const getEventTypeLabel = (event) => (event.type === 'Other' ? (event.typeOtherLabel || 'Other') : event.type);

  const getTargetSummary = (event) => {
    const roles = event?.targetGroups?.roles || [];
    const programs = event?.targetGroups?.programs || [];
    const yearLevels = event?.targetGroups?.yearLevels || [];
    if (roles.length === 0 && programs.length === 0 && yearLevels.length === 0) {
      return 'All users';
    }
    return [
      roles.length ? roles.join(', ') : 'All roles',
      programs.length ? programs.join(', ') : 'All programs',
      yearLevels.length ? yearLevels.map((y) => `${y}Y`).join(', ') : 'All year levels',
    ].join(' • ');
  };

  const handleOpenViewModal = async (eventId) => {
    setIsViewModalOpen(true);
    setViewTab('details');
    setViewLoading(true);
    setViewError('');
    setViewEvent(null);
    setViewReport(null);
    setViewReportError('');
    setViewReportLoading(true);
    try {
      const res = await apiFetch(`/api/events/${eventId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setViewError(data.message || 'Failed to load event details.');
        return;
      }
      setViewEvent(data);

      const reportRes = await apiFetch(`/api/events/${eventId}/analytics`);
      const reportData = await reportRes.json().catch(() => ({}));
      if (!reportRes.ok) {
        setViewReportError(reportData.message || 'Failed to load report data.');
      } else {
        setViewReport(reportData);
      }
    } catch (err) {
      setViewError(err.message || 'Error loading event details.');
    } finally {
      setViewLoading(false);
      setViewReportLoading(false);
    }
  };

  const hasEventEnded = () => {
    if (!viewReport?.endTime) return false;
    return new Date(viewReport.endTime) <= new Date();
  };

  const handleGenerateCertificates = async () => {
    if (!viewEvent?._id) return;
    if (!window.confirm('This will lock the attendance record and generate certificates for all verified attendees. Are you sure you want to continue?')) {
      return;
    }

    try {
      setGeneratingCertificates(true);
      const res = await apiFetch(`/api/events/${viewEvent._id}/certificates`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        window.alert(`Successfully generated ${data.certificatesGenerated} certificates`);
        const analyticsRes = await apiFetch(`/api/events/${viewEvent._id}/analytics`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setViewReport(analyticsData);
          setViewReportError('');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        window.alert(errorData.message || 'Failed to generate certificates');
      }
    } catch (err) {
      window.alert(err.message || 'Error generating certificates');
    } finally {
      setGeneratingCertificates(false);
    }
  };

  const handleDownloadBulkCertificates = async () => {
    if (!viewEvent?._id) return;
    try {
      const res = await apiFetch(`/api/events/${viewEvent._id}/certificates/bulk`);
      if (res.ok) {
        const bytes = await res.arrayBuffer();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event_${viewEvent._id}_certificates.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        window.alert(errorData.message || 'Failed to download certificates');
      }
    } catch (err) {
      window.alert(err.message || 'Error downloading certificates');
    }
  };

  const handleToggleAttendance = async (attendeeUserId, attended) => {
    if (!viewEvent?._id || !attendeeUserId) return;
    setAttendanceSavingUserId(String(attendeeUserId));
    setAttendanceUpdateError('');
    try {
      const res = await apiFetch(`/api/events/${viewEvent._id}/attendees/${attendeeUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAttendanceUpdateError(data.message || 'Failed to update attendance.');
        return;
      }
      if (data?.event) {
        setViewEvent(data.event);
      }
    } catch (err) {
      setAttendanceUpdateError(err.message || 'Error updating attendance.');
    } finally {
      setAttendanceSavingUserId(null);
    }
  };

  const handleDeleteEvent = async (event) => {
    const confirmed = window.confirm(`Delete "${event.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/api/events/${event._id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.message || 'Failed to delete event.');
        return;
      }
      fetchEvents();
    } catch (err) {
      window.alert(err.message || 'Error deleting event.');
    }
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
              <button
                type="button"
                className="spec-btn-secondary"
                onClick={() => navigate('/dashboard/events/calendar')}
              >
                <FiCalendar />
                <span>Events Calendar</span>
              </button>
              <button
                type="button"
                className="spec-btn-primary"
                onClick={() => {
                  setModalMode('create');
                  setActiveEvent(null);
                  setIsCreateModalOpen(true);
                }}
              >
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
            <option value="Other">Other</option>
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
            <div className="results-count-text">
              Showing <strong>{filteredEvents.length}</strong> event{filteredEvents.length === 1 ? '' : 's'}
            </div>
            {filteredEvents.length > PAGE_SIZE ? (
              <div className="results-count-pagination" aria-label="Top pagination controls">
                <button
                  className="pagination-btn pagination-btn-sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!hasPrev}
                  type="button"
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>
                <label className="pagination-input-wrap" aria-label="Page number">
                  <span className="pagination-input-label">Page</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    inputMode="numeric"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageJump}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePageJump();
                      }
                    }}
                    className="pagination-page-input"
                  />
                </label>
                <span className="pagination-info pagination-info-sm">of {totalPages}</span>
                <button
                  className="pagination-btn pagination-btn-sm"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={!hasNext}
                  type="button"
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>
            ) : null}
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
              {!loading && filteredEvents.length > 0 && paginatedEvents.map((event) => (
                <tr key={event._id} className="spec-table-row-clickable">
                  <td>{event.title}</td>
                  <td>{getEventTypeLabel(event)}</td>
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
                        onClick={() => handleOpenViewModal(event._id)}
                      >
                        <FiEye />
                      </button>
                      <button
                        type="button"
                        className="action-btn edit"
                        title="Edit event"
                        aria-label="Edit event"
                        onClick={() => {
                          setModalMode('edit');
                          setActiveEvent(event);
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <FiEdit2 />
                      </button>
                      {canManageEvents ? (
                        <button
                          type="button"
                          className="action-btn delete"
                          title="Delete event"
                          aria-label="Delete event"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          <FiTrash2 />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEvents.length > PAGE_SIZE ? (
          <div className="pagination-controls">
            <div className="results-count-pagination" aria-label="Bottom pagination controls">
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!hasPrev}
                type="button"
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              <label className="pagination-input-wrap" aria-label="Page number">
                <span className="pagination-input-label">Page</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageJump}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePageJump();
                    }
                  }}
                  className="pagination-page-input"
                />
              </label>
              <span className="pagination-info pagination-info-sm">of {totalPages}</span>
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={!hasNext}
                type="button"
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {isCreateModalOpen ? (
        <div
          className="event-create-modal-backdrop"
          onClick={() => setIsCreateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={modalMode === 'edit' ? 'Edit Event' : 'Create Event'}
        >
          <div className="event-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-create-modal-header">
              <div>
                <p className="event-create-modal-eyebrow">Events</p>
                <h3 className="event-create-modal-title">{modalMode === 'edit' ? 'Edit Event' : 'Create Event'}</h3>
                <p className="event-create-modal-sub">
                  {modalMode === 'edit'
                    ? 'Update schedule, audience targeting, and organizers in one place.'
                    : 'Set event details, schedule, audience, and organizers before publishing.'}
                </p>
              </div>
              <button
                type="button"
                className="event-create-modal-close"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label={modalMode === 'edit' ? 'Close edit event modal' : 'Close create event modal'}
              >
                <FiX />
              </button>
            </div>
            <div className="event-create-modal-body">
              <EventCreationForm
                mode={modalMode}
                initialData={activeEvent}
                hideTitle={true}
                onCreated={() => {
                  setIsCreateModalOpen(false);
                  fetchEvents();
                }}
                onUpdated={() => {
                  setIsCreateModalOpen(false);
                  fetchEvents();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {isViewModalOpen ? (
        <div
          className="event-view-modal-backdrop"
          onClick={() => setIsViewModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="View Event"
        >
          <div className="event-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-view-modal-header">
              <div>
                <p className="event-view-modal-eyebrow">Events</p>
                <h3 className="event-view-modal-title">View Event</h3>
                <p className="event-view-modal-sub">Review event details without leaving this page.</p>
              </div>
              <button
                type="button"
                className="event-view-modal-close"
                onClick={() => setIsViewModalOpen(false)}
                aria-label="Close view event modal"
              >
                <FiX />
              </button>
            </div>
            <div className="event-view-modal-body">
              {viewLoading ? (
                <div className="loading">Loading event details...</div>
              ) : null}
              {!viewLoading && viewError ? <div className="spec-alert">{viewError}</div> : null}
              {!viewLoading && !viewError && viewEvent ? (
                <div>
                  <div className="event-view-tabs" role="tablist" aria-label="Event view tabs">
                    <button
                      type="button"
                      className={`event-view-tab ${viewTab === 'details' ? 'active' : ''}`}
                      onClick={() => setViewTab('details')}
                    >
                      Event Details
                    </button>
                    <button
                      type="button"
                      className={`event-view-tab ${viewTab === 'report' ? 'active' : ''}`}
                      onClick={() => setViewTab('report')}
                    >
                      Report
                    </button>
                    <button
                      type="button"
                      className={`event-view-tab ${viewTab === 'registration' ? 'active' : ''}`}
                      onClick={() => setViewTab('registration')}
                    >
                      Registration
                    </button>
                  </div>

                  {viewTab === 'details' ? (
                    <div className="event-view-grid">
                      <div className="event-view-card">
                        <h4>{viewEvent.title}</h4>
                        <p><strong>Type:</strong> {getEventTypeLabel(viewEvent)}</p>
                        <p><strong>Status:</strong> {viewEvent.status}</p>
                        <p><strong>Date:</strong> {formatDate(viewEvent.schedule?.date)}</p>
                        <p><strong>Time:</strong> {formatTime(viewEvent.schedule?.startTime)} - {formatTime(viewEvent.schedule?.endTime)}</p>
                        <p><strong>Venue:</strong> {viewEvent.isVirtual ? `Virtual (${viewEvent.meetingUrl || 'No link'})` : (viewEvent.roomId?.name || 'No venue assigned')}</p>
                        <p><strong>Audience:</strong> {getTargetSummary(viewEvent)}</p>
                      </div>
                      <div className="event-view-card">
                        <h4>Organizers</h4>
                        {Array.isArray(viewEvent.organizers) && viewEvent.organizers.length > 0 ? (
                          <ul className="event-view-organizers">
                            {viewEvent.organizers.map((org, idx) => (
                              <li key={`${org.userId?._id || org.userId || idx}-${idx}`}>
                                <span>{org.userId?.name || org.userId?.username || 'Unknown'}</span>
                                <small>{org.role || 'Organizer'}</small>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No organizers assigned.</p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {viewTab === 'report' ? (
                    <div className="event-view-report-pane">
                      {viewReportLoading ? (
                        <div className="loading">Loading analytics...</div>
                      ) : null}
                      {!viewReportLoading && viewReportError ? <div className="spec-alert">{viewReportError}</div> : null}
                      {!viewReportLoading && !viewReportError && viewReport ? (
                        <div className="dashboard-content">
                          <div className="analytics-overview">
                            <div className="stat-card">
                              <FiUsers className="stat-icon" />
                              <div className="stat-content">
                                <div className="stat-value">{viewReport.totalRsvps}</div>
                                <div className="stat-label">Total RSVPs</div>
                              </div>
                            </div>

                            <div className="stat-card">
                              <FiCheckCircle className="stat-icon success" />
                              <div className="stat-content">
                                <div className="stat-value">{viewReport.attended}</div>
                                <div className="stat-label">Attended</div>
                              </div>
                            </div>

                            <div className="stat-card">
                              <FiXCircle className="stat-icon danger" />
                              <div className="stat-content">
                                <div className="stat-value">{viewReport.notAttended}</div>
                                <div className="stat-label">No-Shows</div>
                              </div>
                            </div>

                            <div className="stat-card">
                              <FiAward className="stat-icon warning" />
                              <div className="stat-content">
                                <div className="stat-value">{viewReport.waitlistConversions}</div>
                                <div className="stat-label">Waitlist Conversions</div>
                              </div>
                            </div>
                          </div>

                          <div className="rates-grid">
                            <div className="rate-card">
                              <h3>Attendance Rate</h3>
                              <div className="rate-value">{viewReport.attendanceRate.toFixed(1)}%</div>
                              <div className="rate-bar">
                                <div className="rate-fill" style={{ width: `${viewReport.attendanceRate}%` }} />
                              </div>
                            </div>

                            <div className="rate-card">
                              <h3>No-Show Rate</h3>
                              <div className="rate-value">{viewReport.noShowRate.toFixed(1)}%</div>
                              <div className="rate-bar">
                                <div className="rate-fill danger" style={{ width: `${viewReport.noShowRate}%` }} />
                              </div>
                            </div>

                            <div className="rate-card">
                              <h3>Waitlist Conversion Rate</h3>
                              <div className="rate-value">{viewReport.waitlistConversionRate.toFixed(1)}%</div>
                              <div className="rate-bar">
                                <div className="rate-fill warning" style={{ width: `${viewReport.waitlistConversionRate}%` }} />
                              </div>
                            </div>
                          </div>

                          {viewReport.feedbackCount > 0 ? (
                            <div className="feedback-summary">
                              <h3>Feedback Summary</h3>
                              <div className="feedback-stats">
                                <div className="feedback-item">
                                  <FiStar className="star-icon" />
                                  <span className="feedback-value">{viewReport.averageRating.toFixed(1)}</span>
                                  <span className="feedback-label">Average Rating</span>
                                </div>
                                <div className="feedback-item">
                                  <FiUsers className="users-icon" />
                                  <span className="feedback-value">{viewReport.feedbackCount}</span>
                                  <span className="feedback-label">Responses</span>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className="certificate-actions">
                            <h3>Certificate Management</h3>
                            {!hasEventEnded() && !viewReport.certificatesGenerated ? (
                              <div className="certificates-not-ready">
                                <FiClock className="clock-icon" />
                                <span>Certificates can be generated after the event ends</span>
                              </div>
                            ) : viewReport.certificatesGenerated ? (
                              <div className="certificates-generated">
                                <FiCheckCircle className="check-icon" />
                                <span>Certificates have been generated</span>
                                <button className="download-btn" onClick={handleDownloadBulkCertificates}>
                                  <FiDownload />
                                  <span>Download All Certificates</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                className="generate-btn"
                                onClick={handleGenerateCertificates}
                                disabled={generatingCertificates}
                              >
                                {generatingCertificates ? (
                                  <>Generating...</>
                                ) : (
                                  <>
                                    <FiAward />
                                    <span>Generate Certificates</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {viewTab === 'registration' ? (
                    <div className="event-view-grid">
                      <div className="event-view-card">
                        <h4>Registration Summary</h4>
                        <p><strong>Registered:</strong> {viewEvent.attendees?.length || 0}</p>
                        <p><strong>Waitlisted:</strong> {viewEvent.waitlist?.length || 0}</p>
                        <p><strong>RSVP Closed:</strong> {viewEvent.rsvpClosed ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="event-view-card">
                        <h4>Registered Attendees</h4>
                        {attendanceUpdateError ? (
                          <p className="event-view-attendance-error">{attendanceUpdateError}</p>
                        ) : null}
                        {Array.isArray(viewEvent.attendees) && viewEvent.attendees.length > 0 ? (
                          <ul className="event-view-organizers">
                            {viewEvent.attendees.map((attendee, idx) => (
                              <li key={`${attendee.userId?._id || attendee.userId || idx}-${idx}`}>
                                <div className="event-view-attendee-info">
                                  <span>{attendee.userId?.name || attendee.userId?.username || 'Unknown'}</span>
                                  <small>{attendee.attended ? 'Present' : 'Not marked'}</small>
                                </div>
                                {canManageEvents ? (
                                  <div className="event-view-attendee-actions">
                                    <button
                                      type="button"
                                      className={`event-view-attendance-btn ${attendee.attended ? 'absent' : 'present'} dynamic`}
                                      onClick={() => handleToggleAttendance(attendee.userId?._id || attendee.userId, !attendee.attended)}
                                      disabled={String(attendanceSavingUserId) === String(attendee.userId?._id || attendee.userId)}
                                    >
                                      {attendee.attended ? 'Mark Absent' : 'Mark Present'}
                                    </button>
                                  </div>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No registered attendees yet.</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="event-view-modal-footer">
              <button
                type="button"
                className="spec-btn-secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
