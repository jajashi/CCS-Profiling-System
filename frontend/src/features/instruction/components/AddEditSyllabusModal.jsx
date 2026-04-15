import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiFetch } from '../../../lib/api';
import '../routes/SyllabusPages.css';

const SYLLABUS_STATUS_ENUM = ['Draft', 'Active'];

const buildBlankLesson = (weekNumber) => ({
  weekNumber,
  topic: '',
  objectives: [],
  materials: [],
  assessments: '',
  timeAllocation: { lectureMinutes: 0, labMinutes: 0 },
});

const buildDefaultFormData = () => ({
  curriculumId: '',
  facultyId: '',
  description: '',
  gradingSystem: '',
  coursePolicies: '',
  status: 'Draft',
  weeklyLessons: [buildBlankLesson(1)],
});

const csvToArray = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

function AddEditSyllabusModal({ isOpen, onClose, editSyllabusId, onSuccess }) {
  const [formData, setFormData] = useState(buildDefaultFormData);
  const [options, setOptions] = useState({
    curricula: [],
    faculty: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isArchived, setIsArchived] = useState(false);
  const [isActiveWarning, setIsActiveWarning] = useState(false);
  const [formError, setFormError] = useState('');
  const formRef = useRef(null);

  const loadOptions = useCallback(async () => {
    try {
      setLoading(true);
      const [curriculaRes, facultyRes] = await Promise.all([
        apiFetch('/api/curricula?status=Active'),
        apiFetch('/api/faculty?status=Active')
      ]);

      const curriculaData = await curriculaRes.json();
      const facultyData = await facultyRes.json();

      if (!curriculaRes.ok || !facultyRes.ok) {
        throw new Error('Failed to load form dropdowns.');
      }

      setOptions({
        curricula: Array.isArray(curriculaData) ? curriculaData : [],
        faculty: Array.isArray(facultyData) ? facultyData : [],
      });
    } catch {
      toast.error('Failed to load dropdown options');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSyllabus = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/syllabi/${id}`);
      const data = await res.json();
      if (res.ok) {
        setFormData({
          curriculumId: data.curriculumId?._id || '',
          facultyId: data.facultyId?._id || '',
          description: data.description || '',
          gradingSystem: data.gradingSystem || '',
          coursePolicies: data.coursePolicies || '',
          status: data.status || 'Draft',
          weeklyLessons: data.weeklyLessons?.length
            ? data.weeklyLessons.map((l, index) => ({
            weekNumber: Number(l.weekNumber) || (index + 1),
            topic: l.topic || '',
            objectives: l.objectives || [],
            materials: l.materials || [],
            assessments: l.assessments || '',
            timeAllocation: {
              lectureMinutes: l.timeAllocation?.lectureMinutes || 0,
              labMinutes: l.timeAllocation?.labMinutes || 0
            }
          }))
            : [buildBlankLesson(1)],
        });
        setIsArchived(data.status === 'Archived');
        setIsActiveWarning(data.status === 'Active');
      }
    } catch {
      toast.error('Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (editSyllabusId) {
        loadSyllabus(editSyllabusId);
      } else {
        setFormData(buildDefaultFormData());
        setIsArchived(false);
        setIsActiveWarning(false);
        setErrors({});
        setFormError('');
      }
    } else {
      setFormData(buildDefaultFormData());
      setOptions({ curricula: [], faculty: [] });
      setErrors({});
      setFormError('');
      setIsArchived(false);
      setIsActiveWarning(false);
    }
  }, [isOpen, editSyllabusId, loadOptions, loadSyllabus]);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const addLesson = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      weeklyLessons: [...prev.weeklyLessons, buildBlankLesson(prev.weeklyLessons.length + 1)],
    }));
  }, []);

  const removeLesson = useCallback(() => {
    if (formData.weeklyLessons.length > 1) {
      const newLessons = formData.weeklyLessons
        .slice(0, -1)
        .map((lesson, index) => ({ ...lesson, weekNumber: index + 1 }));
      setFormData((prev) => ({ ...prev, weeklyLessons: newLessons }));
    }
  }, [formData.weeklyLessons]);

  const updateLessonField = useCallback((index, field, value) => {
    const newLessons = [...formData.weeklyLessons];
    if (field === 'objectives' || field === 'materials') {
      newLessons[index][field] = csvToArray(value);
    } else if (field.startsWith('timeAllocation.')) {
      const taField = field.split('.')[1];
      newLessons[index].timeAllocation = {
        ...newLessons[index].timeAllocation,
        [taField]: Math.max(0, parseInt(value, 10) || 0)
      };
    } else {
      newLessons[index][field] = value;
    }
    setFormData((prev) => ({
      ...prev,
      weeklyLessons: newLessons.map((lesson, lessonIndex) => ({
        ...lesson,
        weekNumber: lessonIndex + 1,
      })),
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`weeklyLessons.${index}.topic`];
      return newErrors;
    });
  }, [formData.weeklyLessons]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.curriculumId) newErrors.curriculumId = 'Curriculum is required';
    if (!formData.facultyId) newErrors.facultyId = 'Faculty is required';

    if (!formData.weeklyLessons || formData.weeklyLessons.length < 1) {
      newErrors.weeklyLessons = 'At least one weekly lesson is required';
    } else {
      formData.weeklyLessons.forEach((lesson, i) => {
        if (!lesson.topic || !lesson.topic.trim()) {
          newErrors[`weeklyLessons.${i}.topic`] = 'Topic is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
      e.preventDefault();
      setFormError('');

      if (!validateForm()) {
        // Scroll to first error
        formRef.current?.querySelector('.field-error')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        return;
      }

      const payload = {
        curriculumId: formData.curriculumId,
        facultyId: formData.facultyId,
        description: formData.description,
        gradingSystem: formData.gradingSystem,
        coursePolicies: formData.coursePolicies,
        weeklyLessons: formData.weeklyLessons.map((l, i) => ({
          weekNumber: i + 1, // always sequential
          topic: l.topic.trim(),
          objectives: l.objectives,
          materials: l.materials,
          assessments: l.assessments,
          timeAllocation: {
            lectureMinutes: l.timeAllocation.lectureMinutes,
            labMinutes: l.timeAllocation.labMinutes,
          },
        })),
      };

      if (editSyllabusId) {
        payload.status = formData.status;
      }

      try {
        setSubmitting(true);

        const res = editSyllabusId
          ? await apiFetch(`/api/syllabi/${editSyllabusId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await apiFetch('/api/syllabi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

        const data = await res.json();

        if (res.status === 409) {
          setFormError(
            data?.message ||
              'A syllabus for this faculty and section already exists.'
          );
          return;
        }

        if (!res.ok) {
          setFormError(data?.message || 'An error occurred. Please try again.');
          return;
        }

        toast.success(
          editSyllabusId
            ? 'Syllabus updated successfully!'
            : 'Syllabus created successfully!'
        );

        onSuccess?.(); // trigger list refresh in parent
        onClose();
      } catch {
        setFormError('Network error. Please check your connection and try again.');
      } finally {
        setSubmitting(false);
      }
  }, [formData, editSyllabusId, validateForm, onClose, onSuccess]);

  const isEditMode = Boolean(editSyllabusId);
  const isDisabled = isArchived || submitting;

  const curriculaOptions = useMemo(
    () =>
      options.curricula.map((c) => ({
        value: c._id,
        label: c.name || c.title || c._id,
      })),
    [options.curricula]
  );

  const facultySelectOptions = useMemo(
    () =>
      options.faculty.map((f) => ({
        value: f._id,
        label: `${f.firstName ?? ''} ${f.lastName ?? ''}`.trim() +
          (f.employeeId ? ` (${f.employeeId})` : ''),
      })),
    [options.faculty]
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="syllabus-modal-title">
      <div className="modal-container syllabus-modal">
        {/* ── Modal Header ── */}
        <div className="modal-header syllabus-modal-header">
          <div className="syllabus-modal-title-group">
            <p className="modal-eyebrow">Syllabus</p>
            <h2 id="syllabus-modal-title" className="modal-title syllabus-modal-title">
              {isEditMode ? 'Edit syllabus' : 'Add syllabus'}
            </h2>
            <p className="syllabus-modal-subtitle">
              Build a standardized syllabus record with required course and lesson details.
            </p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            type="button"
          >
            <FiX />
          </button>
        </div>

        {/* ── Loading Overlay ── */}
        {loading && (
          <div className="modal-loading">
            <FiLoader className="spin-icon" />
            <span>Loading...</span>
          </div>
        )}

        {/* ── Archived Banner ── */}
        {isArchived && (
          <div className="syllabus-banner syllabus-banner--archived" role="alert">
            This syllabus is <strong>Archived</strong>. The form is read-only and cannot be edited.
          </div>
        )}

        {/* ── Active Warning Banner ── */}
        {isActiveWarning && !isArchived && (
          <div className="syllabus-banner syllabus-banner--active" role="alert">
            ⚠️ This syllabus is currently <strong>Active</strong>. Changes will affect the live record.
          </div>
        )}

        {/* ── Top-Level Form Error (e.g. 409 Duplicate) ── */}
        {formError && (
          <div className="syllabus-form-error" role="alert">
            {formError}
          </div>
        )}

        {/* ── Form Body ── */}
        {!loading && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="syllabus-form"
          >
            {/* ════════════════════════════════════════
                SECTION 1 — HEADER DROPDOWNS
            ════════════════════════════════════════ */}
            <section className="form-section">
              <div className="form-grid">

                {/* Curriculum */}
                <div className="form-field">
                  <label htmlFor="curriculumId" className="form-label">
                    Curriculum <span className="required-star">*</span>
                  </label>
                  <select
                    id="curriculumId"
                    className={`form-select ${errors.curriculumId ? 'input-error' : ''}`}
                    value={formData.curriculumId}
                    onChange={(e) => handleInputChange('curriculumId', e.target.value)}
                    disabled={isDisabled}
                  >
                    <option value="">— Select Curriculum —</option>
                    {curriculaOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.curriculumId && (
                    <span className="field-error">{errors.curriculumId}</span>
                  )}
                </div>

                {/* Faculty */}
                <div className="form-field">
                  <label htmlFor="facultyId" className="form-label">
                    Faculty <span className="required-star">*</span>
                  </label>
                  <select
                    id="facultyId"
                    className={`form-select ${errors.facultyId ? 'input-error' : ''}`}
                    value={formData.facultyId}
                    onChange={(e) => handleInputChange('facultyId', e.target.value)}
                    disabled={isDisabled}
                  >
                    <option value="">— Select Faculty —</option>
                    {facultySelectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.facultyId && (
                    <span className="field-error">{errors.facultyId}</span>
                  )}
                </div>

                {isEditMode && (
                  <div className="form-field">
                    <label htmlFor="status" className="form-label">
                      Status
                    </label>
                    <select
                      id="status"
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={isDisabled}
                    >
                      {SYLLABUS_STATUS_ENUM.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              </div>
            </section>

            {/* ════════════════════════════════════════
                SECTION 2 — COURSE DETAILS
            ════════════════════════════════════════ */}
            <section className="form-section">
              <h3 className="form-section-title">Course Details</h3>
              <div className="form-grid form-grid--single">

                {/* Description */}
                <div className="form-field">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="form-textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={isDisabled}
                    placeholder="Enter course description..."
                  />
                </div>

                {/* Grading System */}
                <div className="form-field">
                  <label htmlFor="gradingSystem" className="form-label">
                    Grading System
                  </label>
                  <textarea
                    id="gradingSystem"
                    className="form-textarea"
                    rows={3}
                    value={formData.gradingSystem}
                    onChange={(e) => handleInputChange('gradingSystem', e.target.value)}
                    disabled={isDisabled}
                    placeholder="Describe the grading system..."
                  />
                </div>

                {/* Course Policies */}
                <div className="form-field">
                  <label htmlFor="coursePolicies" className="form-label">
                    Course Policies
                  </label>
                  <textarea
                    id="coursePolicies"
                    className="form-textarea"
                    rows={3}
                    value={formData.coursePolicies}
                    onChange={(e) => handleInputChange('coursePolicies', e.target.value)}
                    disabled={isDisabled}
                    placeholder="Enter course policies..."
                  />
                </div>

              </div>
            </section>

            {/* ════════════════════════════════════════
                SECTION 3 — WEEKLY LESSONS
            ════════════════════════════════════════ */}
            <section className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">Weekly Lessons</h3>
                <div className="lesson-actions">
                  <button
                    type="button"
                    className="lesson-btn lesson-btn--add"
                    onClick={addLesson}
                    disabled={isDisabled}
                  >
                    <FiPlus /> Add Week
                  </button>
                  <button
                    type="button"
                    className="lesson-btn lesson-btn--remove"
                    onClick={removeLesson}
                    disabled={isDisabled || formData.weeklyLessons.length <= 1}
                    title={
                      formData.weeklyLessons.length <= 1
                        ? 'At least one lesson is required'
                        : 'Remove last week'
                    }
                  >
                    <FiTrash2 /> Remove Last
                  </button>
                </div>
              </div>

              {/* Lessons-level error */}
              {errors.weeklyLessons && (
                <span className="field-error">{errors.weeklyLessons}</span>
              )}

              {/* Lessons Table */}
              <div className="syllabus-lessons-table-wrapper">
                <table className="syllabus-lessons-table">
                  <thead>
                    <tr>
                      <th className="col-week">Week</th>
                      <th className="col-topic">
                        Topic <span className="required-star">*</span>
                      </th>
                      <th className="col-objectives">Objectives</th>
                      <th className="col-materials">Materials</th>
                      <th className="col-assessments">Assessments</th>
                      <th className="col-lecture">Lecture Min</th>
                      <th className="col-lab">Lab Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.weeklyLessons.map((lesson, index) => (
                      <tr
                        key={index}
                        className={
                          errors[`weeklyLessons.${index}.topic`]
                            ? 'lesson-row lesson-row--error'
                            : 'lesson-row'
                        }
                      >
                        {/* Week Number (read-only) */}
                        <td className="col-week">
                          <span className="week-badge">{lesson.weekNumber}</span>
                        </td>

                        {/* Topic */}
                        <td className="col-topic">
                          <input
                            type="text"
                            className={`table-input ${
                              errors[`weeklyLessons.${index}.topic`]
                                ? 'input-error'
                                : ''
                            }`}
                            value={lesson.topic}
                            onChange={(e) =>
                              updateLessonField(index, 'topic', e.target.value)
                            }
                            disabled={isDisabled}
                            placeholder="e.g. Introduction to OOP"
                            aria-label={`Week ${lesson.weekNumber} topic`}
                          />
                          {errors[`weeklyLessons.${index}.topic`] && (
                            <span className="field-error field-error--table">
                              {errors[`weeklyLessons.${index}.topic`]}
                            </span>
                          )}
                        </td>

                        <td className="col-objectives">
                          <input
                            type="text"
                            className="table-input"
                            value={
                              Array.isArray(lesson.objectives)
                                ? lesson.objectives.join(', ')
                                : ''
                            }
                            onChange={(e) => updateLessonField(index, 'objectives', e.target.value)}
                            disabled={isDisabled}
                            placeholder="Comma-separated"
                            aria-label={`Week ${lesson.weekNumber} objectives`}
                          />
                        </td>

                        <td className="col-materials">
                          <input
                            type="text"
                            className="table-input"
                            value={
                              Array.isArray(lesson.materials)
                                ? lesson.materials.join(', ')
                                : ''
                            }
                            onChange={(e) => updateLessonField(index, 'materials', e.target.value)}
                            disabled={isDisabled}
                            placeholder="Comma-separated"
                            aria-label={`Week ${lesson.weekNumber} materials`}
                          />
                        </td>

                        {/* Assessments */}
                        <td className="col-assessments">
                          <input
                            type="text"
                            className="table-input"
                            value={lesson.assessments}
                            onChange={(e) =>
                              updateLessonField(index, 'assessments', e.target.value)
                            }
                            disabled={isDisabled}
                            placeholder="e.g. Quiz 1"
                            aria-label={`Week ${lesson.weekNumber} assessments`}
                          />
                        </td>

                        {/* Lecture Minutes */}
                        <td className="col-lecture">
                          <input
                            type="number"
                            className="table-input table-input--number"
                            value={lesson.timeAllocation.lectureMinutes}
                            min={0}
                            onChange={(e) =>
                              updateLessonField(index, 'timeAllocation.lectureMinutes', e.target.value)
                            }
                            disabled={isDisabled}
                            aria-label={`Week ${lesson.weekNumber} lecture minutes`}
                          />
                        </td>

                        {/* Lab Minutes */}
                        <td className="col-lab">
                          <input
                            type="number"
                            className="table-input table-input--number"
                            value={lesson.timeAllocation.labMinutes}
                            min={0}
                            onChange={(e) =>
                              updateLessonField(index, 'timeAllocation.labMinutes', e.target.value)
                            }
                            disabled={isDisabled}
                            aria-label={`Week ${lesson.weekNumber} lab minutes`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ════════════════════════════════════════
                FORM FOOTER — ACTION BUTTONS
            ════════════════════════════════════════ */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isDisabled}
              >
                {submitting ? (
                  <>
                    <FiLoader className="spin-icon" />
                    {isEditMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <FiSave />
                    {isEditMode ? 'Save Changes' : 'Create Syllabus'}
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default AddEditSyllabusModal;