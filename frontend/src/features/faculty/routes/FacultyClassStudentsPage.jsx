import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import './FacultyClassStudentsPage.css';

async function parseErrorMessage(res) {
  try {
    const data = await res.json();
    if (data && typeof data.message === 'string') return data.message;
  } catch {
    // ignore parse failures and use fallback messages
  }
  if (res.status === 401) return 'Session expired. Please log in again.';
  if (res.status === 403) return 'You are not allowed to access this class roster.';
  if (res.status === 404) return 'Class section was not found.';
  return `Request failed (${res.status}).`;
}

export default function FacultyClassStudentsPage() {
  const { sectionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [section, setSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!sectionId) {
      setError('Missing section id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/scheduling/sections/${encodeURIComponent(sectionId)}/roster`);
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      const data = await res.json();
      setSection(data?.section || null);
      setStudents(Array.isArray(data?.students) ? data.students : []);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setSection(null);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredStudents = useMemo(() => {
    const key = query.trim().toLowerCase();
    if (!key) return students;
    return students.filter((st) => {
      const fullName = `${st.lastName || ''}, ${st.firstName || ''}`.toLowerCase();
      return (
        fullName.includes(key) ||
        String(st.id || '').toLowerCase().includes(key) ||
        String(st.email || '').toLowerCase().includes(key) ||
        String(st.program || '').toLowerCase().includes(key)
      );
    });
  }, [students, query]);

  const sectionSubtitle = useMemo(() => {
    if (!section) return '';
    const courseBits = [section.courseCode, section.courseTitle].filter(Boolean).join(' - ');
    const termBits = [section.term, section.academicYear].filter(Boolean).join(' · ');
    return [courseBits, termBits].filter(Boolean).join(' · ');
  }, [section]);

  return (
    <div className="student-directory spec-page faculty-class-students">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiUsers aria-hidden />
        </div>
        <div>
          <p className="directory-hero-title">Class Roster</p>
          <p className="directory-hero-subtitle">
            <span>{sectionSubtitle || 'View enrolled students in this section.'}</span>
          </p>
        </div>
      </div>

      <div className="faculty-class-students__toolbar">
        <Link to="/dashboard/faculty/classes" className="faculty-class-students__back">
          <FiArrowLeft aria-hidden />
          Back to My Classes
        </Link>
        <button type="button" className="faculty-class-students__refresh" onClick={load}>
          <FiRefreshCw aria-hidden />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="faculty-class-students__muted">Loading class roster...</p>
      ) : error ? (
        <div className="faculty-class-students__error-wrap" role="alert">
          <p className="faculty-class-students__error">{error}</p>
        </div>
      ) : (
        <>
          <div className="faculty-class-students__meta-row">
            <p className="faculty-class-students__meta">
              <strong>Section:</strong> {section?.sectionIdentifier || 'N/A'}
            </p>
            <p className="faculty-class-students__meta">
              <strong>Students:</strong> {students.length}
            </p>
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="faculty-class-students__search"
            placeholder="Search by name, student ID, email, or program"
            aria-label="Search students"
          />

          {filteredStudents.length === 0 ? (
            <p className="faculty-class-students__muted">No students match the current filter.</p>
          ) : (
            <div className="faculty-class-students__table-wrap">
              <table className="faculty-class-students__table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Program</th>
                    <th>Year</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st) => (
                    <tr key={st._id || st.id}>
                      <td>{st.id || '—'}</td>
                      <td>{`${st.lastName || ''}, ${st.firstName || ''}`.replace(/^,\s*/, '') || '—'}</td>
                      <td>{st.program || '—'}</td>
                      <td>{st.yearLevel || '—'}</td>
                      <td>{st.email || '—'}</td>
                      <td>{st.status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
