import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiCalendar, FiGrid, FiUsers } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import { readFacultyCache, writeFacultyCache } from '../../../lib/facultyPortalCache';
import { useAuth } from '../../../providers/AuthContext';
import '../../students/routes/StudentInformation.css';
import './FacultyMyClassesPage.css';

const MY_CLASSES_CACHE_KEY = 'my-classes';

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

  const load = useCallback(async () => {
    const hasCache = Array.isArray(readFacultyCache(MY_CLASSES_CACHE_KEY));
    if (!hasCache) setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/scheduling/my-classes');
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      const data = await res.json();
      const next = Array.isArray(data) ? data : [];
      writeFacultyCache(MY_CLASSES_CACHE_KEY, next);
      setClasses(next);
    } catch (e) {
      if (!hasCache) {
        setError(e.message || 'Something went wrong.');
        setClasses([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
            When you’re assigned on a section schedule or your syllabus is linked to a section, they
            will list here.
          </p>
          {facultyKeyLabel ? (
            <p className="faculty-my-classes__empty-meta">
              Signed in as <span className="faculty-my-classes__pill">{facultyKeyLabel}</span>
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="faculty-my-classes__cards">
            {classes.map((row) => (
              <li key={row.sectionId} className="faculty-my-classes__card">
                <div className="faculty-my-classes__card-head">
                  <span className="faculty-my-classes__code">{row.courseCode || '—'}</span>
                  <span className="faculty-my-classes__section">{row.sectionIdentifier}</span>
                </div>
                <h3 className="faculty-my-classes__card-title">{row.courseTitle || 'Course'}</h3>
                <p className="faculty-my-classes__meta">
                  {row.term && row.academicYear
                    ? `${row.term} · ${row.academicYear}`
                    : row.term || row.academicYear || ''}
                  {typeof row.enrolledCount === 'number'
                    ? ` · ${row.enrolledCount} enrolled`
                    : ''}
                </p>
                <div className="faculty-my-classes__card-actions">
                  <Link
                    to={`/dashboard/faculty/classes/${row.sectionId}/students`}
                    className="faculty-my-classes__link faculty-my-classes__link--button"
                  >
                    <FiUsers aria-hidden />
                    Students
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
          <p className="faculty-my-classes__footnote">
            <Link to={MY_SCHEDULE_PATH} className="faculty-my-classes__inline-link">
              <FiCalendar aria-hidden />
              Weekly schedule
            </Link>
            <span className="faculty-my-classes__footnote-sep" aria-hidden>
              ·
            </span>
            <span className="faculty-my-classes__footnote-hint">
              This page is under development.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
