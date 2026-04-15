import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiBookOpen, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import '../../faculty/routes/SpecializationManagement.css';
import './SyllabusPages.css';

function buildFacultyName(faculty) {
  if (!faculty) return 'Unassigned';
  return [faculty.firstName, faculty.lastName].filter(Boolean).join(' ') || faculty.employeeId || 'Unassigned';
}

function formatMinutes(timeAllocation) {
  const lecture = Number(timeAllocation?.lectureMinutes || 0);
  const lab = Number(timeAllocation?.labMinutes || 0);
  if (!lecture && !lab) return '-';
  const parts = [];
  if (lecture) parts.push(`${lecture} min lecture`);
  if (lab) parts.push(`${lab} min lab`);
  return parts.join(' / ');
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
                <div className="syllabus-info-item"><span className="label">Course Code</span><span className="value">{data.curriculumId?.courseCode || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Course Title</span><span className="value">{data.curriculumId?.courseTitle || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Section</span><span className="value">{data.sectionId?.sectionIdentifier || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Term</span><span className="value">{data.sectionId?.term || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Academic Year</span><span className="value">{data.sectionId?.academicYear || '-'}</span></div>
                <div className="syllabus-info-item"><span className="label">Description</span><span className="value">{data.description || 'No course description provided.'}</span></div>
              </div>
            </section>

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
              <div className="spec-table-wrap">
                <table className="spec-table syllabus-table syllabus-weekly-table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Topic</th>
                      <th>Objectives</th>
                      <th>Time Allocation</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!weeklyLessons.length ? (
                      <tr>
                        <td colSpan={5} className="spec-empty">No weekly lessons available.</td>
                      </tr>
                    ) : weeklyLessons.map((lesson) => (
                      <tr key={lesson._id || lesson.weekNumber}>
                        <td>{lesson.weekNumber || '-'}</td>
                        <td>{lesson.topic || '-'}</td>
                        <td>
                          {Array.isArray(lesson.objectives) && lesson.objectives.length ? (
                            <ul className="syllabus-objectives-list">
                              {lesson.objectives.map((objective, index) => (
                                <li key={`${lesson._id || lesson.weekNumber}-objective-${index}`}>{objective}</li>
                              ))}
                            </ul>
                          ) : '-'}
                        </td>
                        <td>{formatMinutes(lesson.timeAllocation)}</td>
                        <td><span className={`status-badge status-${String(lesson.status || '').toLowerCase()}`}>{lesson.status || '-'}</span></td>
                      </tr>
                    ))}
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
