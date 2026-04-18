import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiBookOpen, FiLoader, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import '../../faculty/routes/SpecializationManagement.css';
import './SyllabusPages.css';

function buildFacultyName(faculty) {
  if (!faculty) return 'Unassigned';
  return [faculty.firstName, faculty.lastName].filter(Boolean).join(' ') || faculty.employeeId || 'Unassigned';
}

function formatTimeAllocationLectureLab(timeAllocation) {
  const lecture = Number(timeAllocation?.lectureMinutes || 0);
  const lab = Number(timeAllocation?.labMinutes || 0);
  return `Lecture ${lecture} min / Lab ${lab} min`;
}

function formatDeliveredAt(value) {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function DetailSkeleton() {
  return (
    <div className="syllabus-detail-shell">
      <div className="spec-card syllabus-detail-card">
        <div className="spec-toolbar">
          <div className="spec-toolbar-meta">
            <span className="skeleton-block" style={{ width: '140px', height: '14px' }} />
            <span className="skeleton-block" style={{ width: '280px', height: '18px' }} />
          </div>
        </div>
        <div className="syllabus-detail-content">
          {Array.from({ length: 3 }, (_, sectionIndex) => (
            <section key={`detail-skeleton-${sectionIndex}`} className="syllabus-read-section">
              <span className="skeleton-block" style={{ width: '180px', height: '16px', marginBottom: '1rem' }} />
              <div className="syllabus-info-grid">
                {Array.from({ length: 6 }, (_, itemIndex) => (
                  <div key={`detail-skeleton-item-${itemIndex}`} className="syllabus-info-item">
                    <span className="skeleton-block" style={{ width: '96px', height: '12px', marginBottom: '0.5rem' }} />
                    <span className="skeleton-block" style={{ width: '100%', height: '18px' }} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SyllabusDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingLessonId, setLoadingLessonId] = useState(null);
  const [lessonRowErrors, setLessonRowErrors] = useState(() => ({}));

  const loadSyllabus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/syllabi/${id}`);
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || `Could not load syllabus (${res.status}).`);
      }
      setData(payload);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);

  const weeklyLessons = useMemo(() => {
    return Array.isArray(data?.weeklyLessons)
      ? [...data.weeklyLessons].sort((a, b) => Number(a.weekNumber || 0) - Number(b.weekNumber || 0))
      : [];
  }, [data]);

  const lessonProgress = useMemo(() => {
    const total = weeklyLessons.length;
    const delivered = weeklyLessons.filter((l) => String(l.status || '') === 'Delivered').length;
    const pct = total ? Math.round((delivered / total) * 100) : 0;
    let tone = 'red';
    if (pct === 100) tone = 'green';
    else if (pct >= 50) tone = 'yellow';
    return { total, delivered, pct, tone };
  }, [weeklyLessons]);

  const syllabusInstructorId = data?.facultyId?._id ?? data?.facultyId ?? '';
  const isArchivedSyllabus = String(data?.status || '') === 'Archived';

  const patchLesson = useCallback(
    async (lessonId, body) => {
      const res = await apiFetch(`/api/syllabi/${id}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || `Update failed (${res.status}).`);
      }
      return payload;
    },
    [id],
  );

  const handleMarkDelivered = useCallback(
    async (lessonId) => {
      if (!syllabusInstructorId) return;
      setLoadingLessonId(lessonId);
      setLessonRowErrors((prev) => ({ ...prev, [lessonId]: '' }));
      try {
        const updated = await patchLesson(lessonId, {
          status: 'Delivered',
          facultyId: syllabusInstructorId,
        });
        setData((prev) => {
          if (!prev) return prev;
          const next = prev.weeklyLessons.map((row) =>
            String(row._id) === String(updated._id) ? { ...row, ...updated } : row,
          );
          return { ...prev, weeklyLessons: next };
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not update lesson.';
        setLessonRowErrors((prev) => ({ ...prev, [lessonId]: msg }));
      } finally {
        setLoadingLessonId(null);
      }
    },
    [patchLesson, syllabusInstructorId],
  );

  const handleUndoDelivery = useCallback(
    async (lessonId) => {
      setLoadingLessonId(lessonId);
      setLessonRowErrors((prev) => ({ ...prev, [lessonId]: '' }));
      try {
        const updated = await patchLesson(lessonId, { status: 'Pending' });
        setData((prev) => {
          if (!prev) return prev;
          const next = prev.weeklyLessons.map((row) =>
            String(row._id) === String(updated._id) ? { ...row, ...updated } : row,
          );
          return { ...prev, weeklyLessons: next };
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not update lesson.';
        setLessonRowErrors((prev) => ({ ...prev, [lessonId]: msg }));
      } finally {
        setLoadingLessonId(null);
      }
    },
    [patchLesson],
  );

  const curriculum = data?.curriculumId && typeof data.curriculumId === 'object' ? data.curriculumId : null;
  const clos = Array.isArray(curriculum?.courseLearningOutcomes)
    ? curriculum.courseLearningOutcomes.map((c) => String(c || '').trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="student-directory spec-page syllabi-page">
        <div className="breadcrumb-bar">
          <Link className="breadcrumb-link" to="/dashboard/instruction/syllabi">Back to Syllabi</Link>
        </div>
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="student-directory spec-page syllabi-page">
        <div className="breadcrumb-bar">
          <Link className="breadcrumb-link" to="/dashboard/instruction/syllabi">Back to Syllabi</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">View</span>
        </div>
        <div className="spec-card syllabus-error-card">
          <div className="spec-alert syllabus-error-alert" role="alert">{error || 'Syllabus not found.'}</div>
          <div className="syllabus-error-actions">
            <button type="button" className="spec-btn-secondary" onClick={loadSyllabus}>
              <FiRefreshCw />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-directory spec-page syllabi-page syllabus-detail-page">
      <div className="breadcrumb-bar syllabus-no-print">
        <Link className="breadcrumb-link" to="/dashboard/instruction/syllabi">
          Back to Syllabi
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">View</span>
      </div>

      <div className="syllabus-detail-shell">
        <div className="spec-card syllabus-detail-card">
          <div className="spec-toolbar syllabus-detail-toolbar syllabus-no-print">
            <div className="spec-toolbar-meta">
              <p className="spec-toolbar-title">Syllabus detail</p>
              <p className="spec-toolbar-sub">Read-only formatted document view for screen review and clean printing.</p>
            </div>
            <div className="syllabus-detail-actions">
              <Link to="/dashboard/instruction/syllabi" className="spec-btn-secondary">
                <FiArrowLeft />
                <span>Back</span>
              </Link>
              <button type="button" className="spec-btn-primary" onClick={() => window.print()}>
                <FiPrinter />
                <span>Print</span>
              </button>
            </div>
          </div>

          <article className="syllabus-document">
            <header className="syllabus-document-header syllabus-print-section">
              <div className="syllabus-document-mark"><FiBookOpen /></div>
              <div>
                <p className="modal-eyebrow">Course Syllabus</p>
                <h1 className="syllabus-document-title">{data.curriculumId?.courseTitle || 'Untitled course'}</h1>
                <p className="syllabus-document-subtitle">
                  {data.curriculumId?.courseCode || '-'} • {data.sectionId?.sectionIdentifier || '-'} • {data.sectionId?.term || '-'} • {data.sectionId?.academicYear || '-'}
                </p>
              </div>
              <div className="syllabus-status-wrap">
                <span className={`status-badge status-${String(data.status || '').toLowerCase()}`}>{data.status || '-'}</span>
              </div>
            </header>

            <section className="syllabus-read-section syllabus-print-section">
              <h2 className="syllabus-section-title">Course Information</h2>
              <div className="syllabus-info-grid">
                <div className="syllabus-info-item"><span className="label">Course Code</span><span className="value">{curriculum?.courseCode || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Course Title</span><span className="value">{curriculum?.courseTitle || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Curriculum year (catalog)</span><span className="value">{curriculum?.curriculumYear?.trim() ? curriculum.curriculumYear : '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Credit units</span><span className="value">{curriculum?.creditUnits != null ? `${curriculum.creditUnits} units` : '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Lecture / Lab hours</span><span className="value">{(curriculum?.lectureHours != null || curriculum?.labHours != null) ? `${curriculum?.lectureHours ?? 0} lec / ${curriculum?.labHours ?? 0} lab` : '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Section</span><span className="value">{data.sectionId?.sectionIdentifier || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Term</span><span className="value">{data.sectionId?.term || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Academic Year</span><span className="value">{data.sectionId?.academicYear || '-'}</span></div>
                <div className="syllabus-info-item syllabus-info-span-2"><span className="label">Description</span><span className="value">{data.description || 'No course description provided.'}</span></div>
              </div>
            </section>

            {clos.length ? (
              <section className="syllabus-read-section syllabus-print-section">
                <h2 className="syllabus-section-title">Course Learning Outcomes (CLOs)</h2>
                <ul className="syllabus-clo-checklist syllabus-clo-checklist--readonly">
                  {clos.map((clo, index) => (
                    <li key={`detail-clo-${index}`}>
                      <label className="syllabus-clo-check-label">
                        <input type="checkbox" checked readOnly className="syllabus-clo-checkbox" />
                        <span>{clo}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="syllabus-read-section syllabus-print-section">
              <h2 className="syllabus-section-title">Faculty Information</h2>
              <div className="syllabus-info-grid">
                <div className="syllabus-info-item"><span className="label">Faculty Name</span><span className="value">{buildFacultyName(data.facultyId)}</span></div>
                <div className="syllabus-info-item"><span className="label">Employee ID</span><span className="value">{data.facultyId?.employeeId || '-'}</span></div>
              </div>
            </section>

            <section className="syllabus-read-section syllabus-print-section">
              <h2 className="syllabus-section-title">Grading System</h2>
              <p className="syllabus-body-copy">{data.gradingSystem || 'No grading system provided.'}</p>
            </section>

            <section className="syllabus-read-section syllabus-print-section">
              <h2 className="syllabus-section-title">Policies</h2>
              <p className="syllabus-body-copy">{data.coursePolicies || 'No course policies provided.'}</p>
            </section>

            <section className="syllabus-read-section syllabus-print-section">
              <h2 className="syllabus-section-title">Weekly Lessons</h2>
              {isArchivedSyllabus ? (
                <div className="syllabus-banner syllabus-banner--archived syllabus-lesson-archive-banner" role="status">
                  This syllabus is archived. Lesson tracking is disabled.
                </div>
              ) : null}
              {weeklyLessons.length ? (
                <div
                  className="syllabus-lesson-progress"
                  aria-label={`${lessonProgress.delivered} of ${lessonProgress.total} lessons delivered`}
                >
                  <div className="syllabus-lesson-progress-head">
                    <span className="syllabus-lesson-progress-label">
                      {lessonProgress.delivered} of {lessonProgress.total} lessons delivered
                    </span>
                    <span className="syllabus-lesson-progress-pct">{lessonProgress.pct}%</span>
                  </div>
                  <div className="syllabus-lesson-progress-track">
                    <div
                      className={`syllabus-lesson-progress-fill syllabus-lesson-progress-fill--${lessonProgress.tone}`}
                      style={{ width: `${lessonProgress.pct}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <div className="spec-table-wrap">
                <table className="spec-table syllabus-table syllabus-weekly-table syllabus-weekly-tracking-table">
                  <thead>
                    <tr>
                      <th>Week Number</th>
                      <th>Topic</th>
                      <th>Time Allocation (Lecture / Lab minutes)</th>
                      <th>Status</th>
                      <th>Delivered At</th>
                      {isArchivedSyllabus ? null : (
                        <th className="syllabus-weekly-actions-col syllabus-no-print">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {!weeklyLessons.length ? (
                      <tr>
                        <td colSpan={isArchivedSyllabus ? 5 : 6} className="spec-empty">No weekly lessons available.</td>
                      </tr>
                    ) : weeklyLessons.map((lesson) => {
                      const lessonKey = String(lesson._id || lesson.weekNumber);
                      const rowBusy = loadingLessonId === lessonKey;
                      const statusLabel = lesson.status || '—';
                      const isPending = String(lesson.status || '') === 'Pending';
                      const isDelivered = String(lesson.status || '') === 'Delivered';
                      const rowError = lessonRowErrors[lessonKey];
                      return (
                        <tr key={lessonKey} aria-busy={rowBusy}>
                          <td>{lesson.weekNumber ?? '—'}</td>
                          <td>{lesson.topic || '—'}</td>
                          <td>{formatTimeAllocationLectureLab(lesson.timeAllocation)}</td>
                          <td>
                            <span className={`status-badge status-${String(lesson.status || '').toLowerCase()}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td>{isDelivered ? formatDeliveredAt(lesson.deliveredAt) : '—'}</td>
                          {isArchivedSyllabus ? null : (
                            <td className="syllabus-weekly-actions-cell syllabus-no-print">
                              <div className="syllabus-lesson-actions">
                                {rowBusy ? (
                                  <span className="syllabus-lesson-row-loading" aria-live="polite" aria-label="Updating lesson">
                                    <FiLoader className="spin-icon" aria-hidden />
                                  </span>
                                ) : (
                                  <>
                                    {isPending ? (
                                      <button
                                        type="button"
                                        className="spec-btn-primary btn-sm"
                                        disabled={!syllabusInstructorId}
                                        onClick={() => handleMarkDelivered(lessonKey)}
                                      >
                                        Mark as Delivered
                                      </button>
                                    ) : null}
                                    {isDelivered ? (
                                      <button
                                        type="button"
                                        className="spec-btn-secondary btn-sm"
                                        onClick={() => handleUndoDelivery(lessonKey)}
                                      >
                                        Undo Delivery
                                      </button>
                                    ) : null}
                                  </>
                                )}
                              </div>
                              {rowError ? (
                                <span className="syllabus-lesson-row-error field-error field-error--table" role="alert">
                                  {rowError}
                                </span>
                              ) : null}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
