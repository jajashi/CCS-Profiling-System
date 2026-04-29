import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiChevronLeft, FiChevronRight, FiGrid, FiSearch } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import { readFacultyCache, writeFacultyCache } from '../../../lib/facultyPortalCache';
import { useAuth } from '../../../providers/AuthContext';
import '../../students/routes/StudentInformation.css';
import './FacultyMyClassesPage.css';

const MY_CLASSES_CACHE_KEY = 'my-classes';
const PAGE_SIZE = 8;

const MY_SCHEDULE_PATH = '/dashboard/scheduling/my-schedule';

async function parseErrorMessage(res) {
  try {
    const data = await res.json();
    if (data && typeof data.message === 'string') return data.message;
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'Session expired. Please log in again.';
  if (res.status === 403) return 'You do not have access to this page.';
  return `Request failed (${res.status}).`;
}

export default function FacultyMyClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState(() => {
    const c = readFacultyCache(MY_CLASSES_CACHE_KEY);
    return Array.isArray(c) ? c : [];
  });
  const [loading, setLoading] = useState(() => !Array.isArray(readFacultyCache(MY_CLASSES_CACHE_KEY)));
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const load = useCallback(async () => {
    const hasCache = Array.isArray(readFacultyCache(MY_CLASSES_CACHE_KEY));
    if (!hasCache) setLoading(true);
    setError('');
    try {
      console.log('[FacultyMyClasses] Fetching my-classes for user:', user?.username, user?.employeeId);
      const res = await apiFetch('/api/scheduling/my-classes');
      console.log('[FacultyMyClasses] Response status:', res.status);
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      const data = await res.json();
      console.log('[FacultyMyClasses] Data received:', data?.length || 0, 'classes');
      const next = Array.isArray(data) ? data : [];
      writeFacultyCache(MY_CLASSES_CACHE_KEY, next);
      setClasses(next);
    } catch (e) {
      console.log('[FacultyMyClasses] Error:', e.message);
      if (!hasCache) {
        setError(e.message || 'Something went wrong.');
        setClasses([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const facultyKeyLabel = useMemo(() => {
    const employeeId = user?.employeeId ? String(user.employeeId) : '';
    const username = user?.username ? String(user.username) : '';
    if (employeeId) return employeeId;
    if (username) return username;
    return null;
  }, [user?.employeeId, user?.username]);

  const termOptions = useMemo(
    () => [...new Set(classes.map((row) => String(row.term || '').trim()).filter(Boolean))].sort(),
    [classes],
  );

  const filteredClasses = useMemo(() => {
    const key = query.trim().toLowerCase();
    return classes.filter((row) => {
      if (termFilter && String(row.term || '') !== termFilter) return false;
      if (!key) return true;
      return [
        row.courseCode,
        row.courseTitle,
        row.sectionIdentifier,
        row.term,
        row.academicYear,
      ].some((v) => String(v || '').toLowerCase().includes(key));
    });
  }, [classes, query, termFilter]);

  const totalPages = Math.max(Math.ceil(filteredClasses.length / PAGE_SIZE), 1);
  const paginatedClasses = useMemo(
    () => filteredClasses.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE),
    [filteredClasses, page],
  );
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  useEffect(() => {
    setPage(1);
  }, [query, termFilter, classes.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPageInput(String(page || 1));
  }, [page]);

  const handlePageJump = useCallback(() => {
    const parsed = Number.parseInt(String(pageInput || '').trim(), 10);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(page || 1));
      return;
    }
    const nextPage = Math.min(Math.max(parsed, 1), Math.max(totalPages || 1, 1));
    setPageInput(String(nextPage));
    if (nextPage !== page) setPage(nextPage);
  }, [page, pageInput, totalPages]);

  return (
    <div className="student-directory spec-page faculty-my-classes">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiGrid aria-hidden />
        </div>
        <div>
          <p className="directory-hero-title">My Classes</p>
          <p className="directory-hero-subtitle">
            <span>
              Your teaching sections from scheduling and syllabi—start here when you have assignments.
            </span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="faculty-my-classes__loading" aria-live="polite">
          <div className="faculty-my-classes__skeleton-cards">
            {[1, 2, 3].map((k) => (
              <div key={k} className="faculty-my-classes__skeleton-card" />
            ))}
          </div>
          <p className="faculty-my-classes__muted">Loading…</p>
        </div>
      ) : error ? (
        <div className="faculty-my-classes__error-wrap" role="alert">
          <div className="faculty-my-classes__error">{error}</div>
          <button type="button" className="faculty-my-classes__retry" onClick={load}>
            Try again
          </button>
        </div>
      ) : classes.length === 0 ? (
        <div className="faculty-my-classes__empty-panel">
          <div className="faculty-my-classes__empty-visual" aria-hidden>
            <FiGrid />
          </div>
          <h2 className="faculty-my-classes__empty-heading">No classes to show yet</h2>
          <p className="faculty-my-classes__empty-text">
            When you’re assigned on a section or have scheduled section, they will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="faculty-my-classes__controls">
            <div className="faculty-my-classes__toolbar">
              <div className="search-box faculty-my-classes__search">
                <FiSearch />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by course, title, section, or term"
                  aria-label="Search classes"
                />
              </div>
              <div className="faculty-my-classes__toolbar-right">
                <select
                  className="filter-select curriculum-select faculty-my-classes__term-filter"
                  value={termFilter}
                  onChange={(e) => setTermFilter(e.target.value)}
                >
                  <option value="">All terms</option>
                  {termOptions.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="results-count">
              <div className="results-count-text">
                Showing <strong>{paginatedClasses.length}</strong> class{paginatedClasses.length !== 1 ? 'es' : ''}
              </div>
              {totalPages > 1 ? (
                <div className="results-count-pagination" aria-label="Top pagination controls">
                  <button className="pagination-btn pagination-btn-sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={!hasPrev} type="button" aria-label="Previous page">
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
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePageJump(); }}
                      className="pagination-page-input"
                    />
                  </label>
                  <span className="pagination-info pagination-info-sm">of {totalPages}</span>
                  <button className="pagination-btn pagination-btn-sm" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={!hasNext} type="button" aria-label="Next page">
                    <FiChevronRight />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <ul className="faculty-my-classes__cards">
            {paginatedClasses.map((row) => (
              <li key={row.sectionId} className="faculty-my-classes__card">
                <div className="faculty-my-classes__card-head">
                  <span className="faculty-my-classes__section">{row.sectionIdentifier}</span>
                </div>
                <h3 className="faculty-my-classes__card-title">
                {row.courseTitle || 'Course'} ({row.courseCode})
                </h3>
                <div className="faculty-my-classes__details-grid">
                  <p className="faculty-my-classes__meta">
                    <strong>Term:</strong>{' '}
                    {row.term && row.academicYear
                      ? `${row.term} (${row.academicYear})`
                      : row.term || row.academicYear || 'TBA'}
                  </p>
                  <p className="faculty-my-classes__meta">
                    <strong>Enrolled:</strong> {Number(row.enrolledCount || 0)} students
                  </p>
                </div>
                <div className="faculty-my-classes__card-actions">
                  <Link
                    to={`/dashboard/faculty/classes/${row.sectionId}`}
                    className="faculty-my-classes__link"
                  >
                    <FiGrid aria-hidden />
                    Overview
                  </Link>
                  {row.syllabusId ? (
                    <Link
                      to={`/dashboard/instruction/syllabi/${row.syllabusId}`}
                      className="faculty-my-classes__link"
                    >
                      <FiBookOpen aria-hidden />
                      Open syllabus
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard/instruction/syllabi"
                      className="faculty-my-classes__link faculty-my-classes__link--muted"
                    >
                      <FiBookOpen aria-hidden />
                      Link a syllabus
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 ? (
            <div className="pagination-controls">
              <div className="results-count-pagination" aria-label="Bottom pagination controls">
                <button className="pagination-btn pagination-btn-sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={!hasPrev} type="button" aria-label="Previous page">
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
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePageJump(); }}
                    className="pagination-page-input"
                  />
                </label>
                <span className="pagination-info pagination-info-sm">of {totalPages}</span>
                <button className="pagination-btn pagination-btn-sm" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={!hasNext} type="button" aria-label="Next page">
                  <FiChevronRight />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
