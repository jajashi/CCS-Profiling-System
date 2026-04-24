import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { FiChevronRight, FiSave } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import ClassHeader from '../components/ClassHeader';
import RosterAttendanceTable from '../components/RosterAttendanceTable';
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
  const [sessionDate, setSessionDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState('');

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
      const nextStudents = Array.isArray(data?.students) ? data.students : [];
      setStudents(nextStudents);
      setRecords((prev) => {
        const next = { ...prev };
        nextStudents.forEach((st) => {
          const key = st._id || st.id;
          if (!next[key]) next[key] = 'Present';
        });
        return next;
      });
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

  const sectionSubtitle = useMemo(() => {
    if (!section) return '';
    const courseBits = [section.courseCode, section.courseTitle].filter(Boolean).join(' - ');
    const termBits = [section.sectionIdentifier, section.term, section.academicYear].filter(Boolean).join(' · ');
    return [courseBits, termBits].filter(Boolean).join(' · ') || 'Manage roster and attendance in one list.';
  }, [section]);

  const loadSessionAttendance = useCallback(async () => {
    if (!sectionId || !sessionDate || students.length === 0) return;
    try {
      const res = await apiFetch(
        `/api/scheduling/sections/${encodeURIComponent(sectionId)}/attendance?sessionDate=${encodeURIComponent(sessionDate)}`,
      );
      if (!res.ok) throw new Error(await parseErrorMessage(res));
      const data = await res.json();
      const byStudentId = {};
      (Array.isArray(data?.records) ? data.records : []).forEach((row) => {
        if (row?.studentId) byStudentId[String(row.studentId)] = row.status;
      });
      setLastSavedAt(data?.updatedAt ? String(data.updatedAt) : '');
      setRecords((prev) => {
        const next = { ...prev };
        students.forEach((st) => {
          const key = st._id || st.id;
          next[key] = byStudentId[key] || 'Present';
        });
        return next;
      });
    } catch (e) {
      setError(e.message || 'Failed to load attendance.');
      toast.error(e.message || 'Failed to load attendance.');
    }
  }, [sectionId, sessionDate, students]);

  useEffect(() => {
    loadSessionAttendance();
  }, [loadSessionAttendance]);

  const saveAttendance = useCallback(async () => {
    if (!sectionId || !sessionDate) return;
    setSaving(true);
    setError('');
    try {
      const payload = students.map((st) => {
        const key = st._id || st.id;
        return { studentId: key, status: records[key] || 'Present' };
      });
      const res = await apiFetch(`/api/scheduling/sections/${encodeURIComponent(sectionId)}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDate, records: payload }),
      });
      if (!res.ok) throw new Error(await parseErrorMessage(res));
      const data = await res.json();
      setLastSavedAt(data?.updatedAt ? String(data.updatedAt) : '');
      toast.success('Attendance saved.');
    } catch (e) {
      setError(e.message || 'Failed to save attendance.');
      toast.error(e.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  }, [sectionId, sessionDate, students, records]);

  return (
    <div className="student-directory spec-page faculty-class-students">
      <ClassHeader sectionId={sectionId} section={section} subtitle={sectionSubtitle} />

      <div className="faculty-class-students__breadcrumb" aria-label="Breadcrumb">
        <div className="faculty-class-students__breadcrumb-path">
          <Link to="/dashboard/faculty/classes">My Classes</Link>
          <FiChevronRight aria-hidden />
          <Link to={`/dashboard/faculty/classes/${encodeURIComponent(sectionId || '')}`}>Class Overview</Link>
          <FiChevronRight aria-hidden />
          <span>Class List & Attendance</span>
        </div>
      </div>

      {loading ? (
        <p className="faculty-class-students__muted">Loading class roster...</p>
      ) : error ? (
        <div className="faculty-class-students__error-wrap" role="alert">
          <p className="faculty-class-students__error">{error}</p>
        </div>
      ) : (
        <>
          <RosterAttendanceTable
            students={students}
            records={records}
            sessionDate={sessionDate}
            onRefresh={load}
            rightActions={(
              <>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="faculty-class-students__date"
                  aria-label="Attendance date"
                />
                <button type="button" className="faculty-class-students__refresh" onClick={saveAttendance} disabled={saving || students.length === 0}>
                  <FiSave aria-hidden />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            onRecordChange={(studentKey, value) =>
              setRecords((prev) => ({ ...prev, [studentKey]: value }))
            }
          />
        </>
      )}
    </div>
  );
}
