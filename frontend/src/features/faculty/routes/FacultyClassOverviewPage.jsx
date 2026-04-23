import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiBookOpen, FiCalendar, FiChevronRight, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import './FacultyClassOverviewPage.css';

async function parseErrorMessage(res) {
  try {
    const data = await res.json();
    if (data && typeof data.message === 'string') return data.message;
  } catch {
    // ignore parse failures and use fallback messages
  }
  if (res.status === 401) return 'Session expired. Please log in again.';
  if (res.status === 403) return 'You are not allowed to access this class.';
  if (res.status === 404) return 'Class section was not found.';
  return `Request failed (${res.status}).`;
}

function formatTime12(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value || '--:--';
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value || '--:--';
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function FacultyClassOverviewPage() {
  const { sectionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [section, setSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [scheduleRows, setScheduleRows] = useState([]);

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
      if (!res.ok) throw new Error(await parseErrorMessage(res));
      const data = await res.json();
      setSection(data?.section || null);
      setStudents(Array.isArray(data?.students) ? data.students : []);
      const scheduleRes = await apiFetch('/api/scheduling/my-schedule');
      const scheduleData = await scheduleRes.json().catch(() => []);
      if (scheduleRes.ok && Array.isArray(scheduleData)) {
        const forClass = scheduleData.filter((r) => String(r.sectionId || '') === String(sectionId || ''));
        setScheduleRows(forClass.slice(0, 3));
      } else {
        setScheduleRows([]);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setSection(null);
      setStudents([]);
      setScheduleRows([]);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const classIdentity = useMemo(() => {
    if (!section) return '';
    const courseBits = [section.courseCode, section.courseTitle].filter(Boolean).join(' - ');
    const sectionBits = [section.sectionIdentifier, section.term, section.academicYear].filter(Boolean).join(' · ');
    return [courseBits, sectionBits].filter(Boolean).join(' · ');
  }, [section]);

  return (
    <div className="student-directory spec-page faculty-class-overview">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiBookOpen aria-hidden />
        </div>
        <div>
          <p className="directory-hero-title">Class Overview</p>
          <p className="directory-hero-subtitle">
            <span>Review class schedule, section details, and teaching tools.</span>
          </p>
        </div>
      </div>

      <div className="faculty-class-overview__breadcrumb" aria-label="Breadcrumb">
        <div className="faculty-class-overview__breadcrumb-path">
          <Link to="/dashboard/faculty/classes">← My Classes</Link>
          <FiChevronRight aria-hidden />
          {/* section (coursecode*/}
          <span> {section?.sectionIdentifier || 'N/A'} - ({section?.courseCode || 'N/A'}) {section?.courseTitle || 'N/A'}</span>
        </div>
        <button type="button" className="faculty-class-overview__refresh faculty-class-overview__refresh--plain" onClick={load}>
          <FiRefreshCw aria-hidden />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="faculty-class-overview__muted">Loading class details...</p>
      ) : error ? (
        <div className="faculty-class-overview__error-wrap" role="alert">
          <p className="faculty-class-overview__error">{error}</p>
        </div>
      ) : (
        <>
          <div className="faculty-class-overview__content">
            <div className="faculty-class-overview__content-head">
              <FiBookOpen aria-hidden />
              <div className="faculty-class-overview__content-head-text">
                <h3>Class Details</h3>
              </div>
            </div>
            <div className="faculty-class-overview__details-grid">              
              <div className="faculty-class-overview__detail">
                <p className="faculty-class-overview__detail-line">
                  <strong>Course:</strong> {section?.courseCode && section?.courseTitle
                    ? `${section.courseCode} - ${section.courseTitle}`
                    : section?.courseCode || section?.courseTitle || 'N/A'}
                </p>
              </div>
              <div className="faculty-class-overview__detail">
                <p className="faculty-class-overview__detail-line">
                  <strong>Instructor:</strong> {section?.facultyName || section?.instructorName || 'Assigned instructor'}
                </p>
              </div>
              <div className="faculty-class-overview__detail faculty-class-overview__detail--wide">
                <p className="faculty-class-overview__detail-line">
                  <strong>Date and Time:</strong> {scheduleRows.map((r) => `${r.dayOfWeek || 'Day'}, ${formatTime12(r.startTime || '--:--')} -${formatTime12(r.endTime || '--:--')}`).join(' | ')}
                </p>
              </div>
              {/* assigned room */}
              <div className="faculty-class-overview__detail">
                <p className="faculty-class-overview__detail-line">
                <strong>Assigned Room:</strong> {section?.roomName || 'TBA'}
                </p>
              </div>
              <div className="faculty-class-overview__detail">
                <p className="faculty-class-overview__detail-line">
                  <strong>Section:</strong> {section?.sectionIdentifier || 'N/A'}
                </p>
              </div>
              <div className="faculty-class-overview__detail">
                <p className="faculty-class-overview__detail-line">
                  <strong>Enrolled students:</strong> {students.length}
                </p>
              </div>
              <div className="faculty-class-overview__detail">
                <p className="faculty-class-overview__detail-line">
                  <strong>Term/Academic Year:</strong> {section?.term || 'N/A'} ({section?.academicYear || 'N/A'})
                </p>
              </div>
            </div>
          </div>
          <div className="faculty-class-overview__modules">
            <Link
              to={`/dashboard/faculty/classes/${encodeURIComponent(sectionId || '')}/students`}
              className="faculty-class-overview__module"
            >
              <FiUsers aria-hidden />
              <div>
                <h3>Class List & Attendance</h3>
                <p>Single list for enrolled students with inline attendance marking.</p>
              </div>
              <FiChevronRight className="faculty-class-overview__module-chevron" aria-hidden />
            </Link>
            <Link
              to={`/dashboard/instruction/syllabi`}
              className="faculty-class-overview__module"
            >
              <FiBookOpen aria-hidden />
              <div>
                <h3>Syllabi</h3>
                <p>Open syllabus pages for course outline and lesson references.</p>
              </div>
              <FiChevronRight className="faculty-class-overview__module-chevron" aria-hidden />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
