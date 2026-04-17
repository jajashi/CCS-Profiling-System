import React, { useCallback, useEffect, useState } from 'react';
import { FiExternalLink, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import '../routes/SyllabusPages.css';

function buildFacultyName(faculty) {
  if (!faculty) return '—';
  const name = [faculty.firstName, faculty.lastName].filter(Boolean).join(' ');
  return name || faculty.employeeId || '—';
}

export default function SyllabusQuickViewModal({ syllabusId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!syllabusId) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/syllabi/${syllabusId}`);
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || `Could not load syllabus (${res.status}).`);
      }
      setData(payload);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Failed to load syllabus.');
    } finally {
      setLoading(false);
    }
  }, [syllabusId]);

  useEffect(() => {
    if (isOpen && syllabusId) {
      load();
    } else {
      setData(null);
      setError('');
    }
  }, [isOpen, syllabusId, load]);

  if (!isOpen) return null;

  const curriculum = data?.curriculumId && typeof data.curriculumId === 'object' ? data.curriculumId : null;
  const clos = Array.isArray(curriculum?.courseLearningOutcomes)
    ? curriculum.courseLearningOutcomes.map((c) => String(c || '').trim()).filter(Boolean)
    : [];

  return (
    <div className="modal-overlay syllabus-quick-overlay" role="dialog" aria-modal="true" aria-labelledby="syllabus-quick-title">
      <div className="modal-container syllabus-modal syllabus-quick-modal">
        <div className="modal-header syllabus-modal-header">
          <div className="syllabus-modal-title-group">
            <p className="modal-eyebrow">Preview</p>
            <h2 id="syllabus-quick-title" className="modal-title syllabus-modal-title">
              {curriculum?.courseTitle || 'Syllabus'}
            </h2>
            <p className="syllabus-modal-subtitle">
              {curriculum?.courseCode ? `${curriculum.courseCode} · ` : ''}
              {data?.sectionId?.sectionIdentifier || '—'} · {data?.sectionId?.term || '—'} · {data?.sectionId?.academicYear || '—'}
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close preview">
            <FiX />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <span>Loading syllabus…</span>
          </div>
        ) : null}

        {error ? (
          <div className="syllabus-form-error" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error && data ? (
          <div className="syllabus-quick-body">
            <div className="syllabus-quick-meta">
              <div>
                <span className="syllabus-quick-label">Faculty</span>
                <span className="syllabus-quick-value">{buildFacultyName(data.facultyId)}</span>
              </div>
              <div>
                <span className="syllabus-quick-label">Status</span>
                <span className={`status-badge status-${String(data.status || '').toLowerCase()}`}>{data.status}</span>
              </div>
              <div>
                <span className="syllabus-quick-label">Curriculum year</span>
                <span className="syllabus-quick-value">{curriculum?.curriculumYear?.trim() ? curriculum.curriculumYear : '—'}</span>
              </div>
              <div>
                <span className="syllabus-quick-label">Credit units</span>
                <span className="syllabus-quick-value">{curriculum?.creditUnits != null ? `${curriculum.creditUnits} units` : '—'}</span>
              </div>
              <div>
                <span className="syllabus-quick-label">Academic year</span>
                <span className="syllabus-quick-value">{data.sectionId?.academicYear || '—'}</span>
              </div>
            </div>

            {clos.length ? (
              <div className="syllabus-quick-clos">
                <span className="syllabus-quick-label">Course learning outcomes (CLOs)</span>
                <ul className="syllabus-clo-checklist">
                  {clos.map((clo, index) => (
                    <li key={`clo-${index}`}>
                      <label className="syllabus-clo-check-label">
                        <input type="checkbox" checked readOnly className="syllabus-clo-checkbox" />
                        <span>{clo}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="syllabus-quick-muted">No CLOs listed on the curriculum record.</p>
            )}

            <div className="syllabus-quick-footer">
              <Link to={`/dashboard/instruction/syllabi/${syllabusId}`} className="spec-btn-primary syllabus-quick-link" onClick={onClose}>
                <FiExternalLink />
                <span>Open full document</span>
              </Link>
            </div>
            <p className="syllabus-quick-hint">Use Print on the full document page for a clean print layout.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
