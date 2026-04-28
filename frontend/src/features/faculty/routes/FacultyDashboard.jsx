import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiBriefcase,
  FiBook,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiMonitor,
  FiUsers,
  FiUserX,
} from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import '../../dashboard/routes/DashboardHome.css';
import './FacultyDashboard.css';

const DIRECTORY_ADD_LINK = '/dashboard/faculty/directory?add=1';

function pct(part, whole) {
  if (!whole || whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

const FacultyDashboard = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchAnalytics = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    if (showLoading) setError('');
    try {
      const res = await apiFetch('/api/faculty/analytics');
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const json = await res.json();
      setData(json && typeof json === 'object' ? json : null);
      if (showLoading) setError('');
    } catch {
      if (showLoading) {
        setError(
          'We could not load faculty analytics right now. Please check your connection and try again.',
        );
        setData(null);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics({ showLoading: true });
  }, [fetchAnalytics, location.key]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics({ showLoading: false });
      }
    };
    const onFocus = () => fetchAnalytics({ showLoading: false });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAnalytics]);

  const total = data?.totalFaculty ?? 0;
  const active = data?.activeFaculty ?? 0;
  const inactive = data?.inactiveFaculty ?? 0;
  const fullTime = data?.fullTimeFaculty ?? 0;
  const partTime = data?.partTimeFaculty ?? 0;
  const itCount = data?.itDepartmentCount ?? 0;
  const csCount = data?.csDepartmentCount ?? 0;

  const statusTotal = active + inactive;
  const employmentTotal = fullTime + partTime;
  const deptSum = itCount + csCount;

  const activePct = pct(active, statusTotal);
  const inactivePct = pct(inactive, statusTotal);
  const ftPct = pct(fullTime, employmentTotal);
  const ptPct = pct(partTime, employmentTotal);
  const itDeptPct = pct(itCount, deptSum);
  const csDeptPct = pct(csCount, deptSum);

  return (
    <div className="dashboard-home faculty-dashboard">
      <div className="page-header">
        <h2>Faculty Dashboard</h2>
        <p className="subtitle">
          Summary statistics and resource distribution across the faculty roster.
        </p>
      </div>

      {error ? (
        <div className="faculty-dashboard-error" role="alert">
          <p style={{ margin: 0 }}>{error}</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => fetchAnalytics({ showLoading: true })}
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="faculty-dashboard-skeleton-grid" aria-busy="true" aria-label="Loading analytics">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
            <div key={k} className="faculty-dashboard-skeleton-card" />
          ))}
        </div>
      ) : null}

      {!loading && !error && data && total === 0 ? (
        <div className="faculty-dashboard-empty">
          <h3>No faculty data available</h3>
          <p>There are no faculty records yet. Add a faculty member to see metrics and distributions here.</p>
          <Link to={DIRECTORY_ADD_LINK} className="btn btn-primary">
            Add a new faculty member
          </Link>
        </div>
      ) : null}

      {!loading && data && total > 0 ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon users">
                <FiUsers />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Faculty</p>
                <h3 className="stat-value">{total.toLocaleString()}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon events">
                <FiCheckCircle />
              </div>
              <div className="stat-details">
                <p className="stat-label">Active Faculty</p>
                <h3 className="stat-value">{active.toLocaleString()}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon instruction">
                <FiUserX />
              </div>
              <div className="stat-details">
                <p className="stat-label">Inactive Faculty</p>
                <h3 className="stat-value">{inactive.toLocaleString()}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon faculty">
                <FiBriefcase />
              </div>
              <div className="stat-details">
                <p className="stat-label">Full-time</p>
                <h3 className="stat-value">{fullTime.toLocaleString()}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon instruction">
                <FiClock />
              </div>
              <div className="stat-details">
                <p className="stat-label">Part-time</p>
                <h3 className="stat-value">{partTime.toLocaleString()}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon faculty">
                <FiMonitor />
              </div>
              <div className="stat-details">
                <p className="stat-label">IT Department</p>
                <h3 className="stat-value">{itCount.toLocaleString()}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon users">
                <FiBook />
              </div>
              <div className="stat-details">
                <p className="stat-label">CS Department</p>
                <h3 className="stat-value">{csCount.toLocaleString()}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon events">
                <FiLayers />
              </div>
              <div className="stat-details">
                <p className="stat-label">Assigned Sections</p>
                <h3 className="stat-value">{(data?.totalAssignedSections ?? 0).toLocaleString()}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon users">
                <FiLayers />
              </div>
              <div className="stat-details">
                <p className="stat-label">Avg Load / Faculty</p>
                <h3 className="stat-value">{data?.averageLoad ?? 0} sections</h3>
              </div>
            </div>
          </div>

          <section className="faculty-dashboard-distributions" aria-label="Faculty distributions">
            <h3>Distribution overview</h3>

            <div className="distribution-row">
              <div className="distribution-row-header">
                <span className="distribution-row-label">Active vs Inactive</span>
                <span>
                  {activePct}% / {inactivePct}%
                </span>
              </div>
              <div className="distribution-bar-track" role="img" aria-label={`Active ${activePct} percent, inactive ${inactivePct} percent`}>
                <div
                  className="distribution-bar-segment distribution-bar-segment--active"
                  style={{ width: `${activePct}%` }}
                />
                <div
                  className="distribution-bar-segment distribution-bar-segment--inactive"
                  style={{ width: `${inactivePct}%` }}
                />
              </div>
              <div className="distribution-badges">
                <span className="distribution-badge distribution-badge--active">
                  Active {active.toLocaleString()}
                </span>
                <span className="distribution-badge distribution-badge--inactive">
                  Inactive {inactive.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="distribution-row">
              <div className="distribution-row-header">
                <span className="distribution-row-label">Full-time vs Part-time</span>
                <span>
                  {ftPct}% / {ptPct}%
                </span>
              </div>
              <div
                className="distribution-bar-track"
                role="img"
                aria-label={`Full-time ${ftPct} percent, part-time ${ptPct} percent`}
              >
                <div
                  className="distribution-bar-segment distribution-bar-segment--fulltime"
                  style={{ width: `${ftPct}%` }}
                />
                <div
                  className="distribution-bar-segment distribution-bar-segment--parttime"
                  style={{ width: `${ptPct}%` }}
                />
              </div>
              <div className="distribution-badges">
                <span className="distribution-badge distribution-badge--fulltime">
                  Full-time {fullTime.toLocaleString()}
                </span>
                <span className="distribution-badge distribution-badge--parttime">
                  Part-time {partTime.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="distribution-row">
              <div className="distribution-row-header">
                <span className="distribution-row-label">Department split (IT vs CS)</span>
                <span>
                  {itDeptPct}% / {csDeptPct}%
                </span>
              </div>
              <div
                className="distribution-bar-track"
                role="img"
                aria-label={`IT ${itDeptPct} percent, CS ${csDeptPct} percent`}
              >
                <div
                  className="distribution-bar-segment distribution-bar-segment--it"
                  style={{ width: `${itDeptPct}%` }}
                />
                <div
                  className="distribution-bar-segment distribution-bar-segment--cs"
                  style={{ width: `${csDeptPct}%` }}
                />
              </div>
              <div className="distribution-badges">
                <span className="distribution-badge distribution-badge--it">IT {itCount.toLocaleString()}</span>
                <span className="distribution-badge distribution-badge--cs">CS {csCount.toLocaleString()}</span>
              </div>
            </div>
          </section>
        </>
      ) : null}

    </div>
  );
};

export default FacultyDashboard;
