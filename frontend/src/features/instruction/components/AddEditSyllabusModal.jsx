import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave, FiLoader, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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

const SYLLABUS_STEPS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'details', label: 'Course Details' },
  { id: 'lessons', label: 'Lesson Plan' },
];

function AddEditSyllabusModal({ isOpen, onClose, editSyllabusId, initialSectionId, onSuccess }) {
  const [formData, setFormData] = useState(buildDefaultFormData);
  const [options, setOptions] = useState({
    curricula: [],
    faculty: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSection, setLoadingSection] = useState(false);
  const [resolvedSectionId, setResolvedSectionId] = useState('');
  const [sectionPreview, setSectionPreview] = useState(null);
  const [sectionMetaError, setSectionMetaError] = useState('');
  const [sectionScheduleNotice, setSectionScheduleNotice] = useState('');
  const [errors, setErrors] = useState({});
  const [isArchived, setIsArchived] = useState(false);
  const [isActiveWarning, setIsActiveWarning] = useState(false);
  const [formError, setFormError] = useState('');
  const [syllabusReady, setSyllabusReady] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const formRef = useRef(null);
  const preferredSectionIdRef = useRef('');
  const headerDirtyRef = useRef(false);
  const [clonableSyllabi, setClonableSyllabi] = useState([]);
  const [selectedCloneId, setSelectedCloneId] = useState('');

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

  const loadClonableSyllabi = useCallback(async (curId) => {
    try {
      const res = await apiFetch(`/api/syllabi?curriculumId=${encodeURIComponent(curId)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setClonableSyllabi(data);
      }
    } catch {
      setClonableSyllabi([]);
    }
  }, []);

  const handleCloneSelect = useCallback(async (cloneId) => {
    setSelectedCloneId(cloneId);
    if (!cloneId) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/syllabi/${cloneId}`);
      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({
          ...prev,
          description: data.description || '',
          gradingSystem: data.gradingSystem || '',
          coursePolicies: data.coursePolicies || '',
          weeklyLessons: data.weeklyLessons?.length
            ? data.weeklyLessons.map((l, index) => ({
                weekNumber: Number(l.weekNumber) || index + 1,
                topic: l.topic || '',
                objectives: l.objectives || [],
                materials: l.materials || [],
                assessments: l.assessments || '',
                timeAllocation: {
                  lectureMinutes: l.timeAllocation?.lectureMinutes || 0,
                  labMinutes: l.timeAllocation?.labMinutes || 0,
                },
              }))
            : prev.weeklyLessons,
        }));
        toast.success(`Imported content from ${data.curriculumId?.courseCode || 'selected'} syllabus`);
      }
    } catch {
      toast.error('Failed to import syllabus content');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSyllabus = useCallback(async (id) => {
    try {
      setLoading(true);
      setSyllabusReady(false);
      const res = await apiFetch(`/api/syllabi/${id}`);
      const data = await res.json();
      if (res.ok) {
        setFormData({
          curriculumId: data.curriculumId?._id || data.curriculumId || '',
          facultyId: data.facultyId?._id || data.facultyId || '',
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
        const sec = data.sectionId && typeof data.sectionId === 'object' ? data.sectionId : null;
        const cur = data.curriculumId && typeof data.curriculumId === 'object' ? data.curriculumId : null;
        const sid = sec?._id || data.sectionId || '';
        preferredSectionIdRef.current = sid ? String(sid) : '';
        setResolvedSectionId(sid);
        setSectionPreview(
          sec
            ? {
                sectionIdentifier: sec.sectionIdentifier,
                term: sec.term,
                academicYear: sec.academicYear,
                curriculumYear: cur?.curriculumYear,
                creditUnits: cur?.creditUnits,
              }
            : null,
        );
        setSectionMetaError('');
        setSectionScheduleNotice(
          sid
            ? ''
            : 'No active section in Scheduling yet. You can still save the syllabus; term and academic year will appear here once a section is assigned.',
        );
        setIsArchived(data.status === 'Archived');
        setIsActiveWarning(data.status === 'Active');
      }
    } catch {
      toast.error('Failed to load syllabus');
    } finally {
      setLoading(false);
      setSyllabusReady(true);
    }
  }, []);

  const loadSection = useCallback(async (sectionId) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/scheduling/sections/${sectionId}`);
      const section = await res.json();
      if (res.ok) {
        const curId = section.curriculumId?._id || section.curriculumId || '';
        const facId = section.schedules?.[0]?.facultyId?._id || section.schedules?.[0]?.facultyId || '';
        setFormData((prev) => ({
          ...prev,
          curriculumId: curId,
          facultyId: facId,
        }));
        preferredSectionIdRef.current = String(sectionId);
        headerDirtyRef.current = true;
      }
    } catch {
      toast.error('Failed to pre-fill section data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
      loadOptions();
      if (editSyllabusId) {
        headerDirtyRef.current = false;
        setSyllabusReady(false);
        loadSyllabus(editSyllabusId);
      } else if (initialSectionId) {
        headerDirtyRef.current = false;
        setSyllabusReady(true);
        setFormData(buildDefaultFormData());
        loadSection(initialSectionId);
      } else {
        headerDirtyRef.current = false;
        setSyllabusReady(true);
        setFormData(buildDefaultFormData());
        preferredSectionIdRef.current = '';
        setResolvedSectionId('');
        setSectionPreview(null);
        setSectionMetaError('');
        setSectionScheduleNotice('');
        setIsArchived(false);
        setIsActiveWarning(false);
        setErrors({});
        setFormError('');
      }
    } else {
      setActiveStep(0);
      setFormData(buildDefaultFormData());
      setOptions({ curricula: [], faculty: [] });
      preferredSectionIdRef.current = '';
      headerDirtyRef.current = false;
      setResolvedSectionId('');
      setSectionPreview(null);
      setSectionMetaError('');
      setSectionScheduleNotice('');
      setErrors({});
      setFormError('');
      setIsArchived(false);
      setIsActiveWarning(false);
      setSyllabusReady(true);
    }
  }, [isOpen, editSyllabusId, initialSectionId, loadOptions, loadSyllabus, loadSection, loadClonableSyllabi]);

  useEffect(() => {
    if (!isOpen || isArchived || !syllabusReady) return undefined;
    if (editSyllabusId && !headerDirtyRef.current) return undefined;
    if (!formData.curriculumId || !formData.facultyId) {
      setResolvedSectionId('');
      setSectionPreview(null);
      setSectionMetaError('');
      setSectionScheduleNotice('');
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingSection(true);
        setSectionMetaError('');
        setSectionScheduleNotice('');
        const res = await apiFetch(
          `/api/scheduling/sections?curriculumId=${encodeURIComponent(formData.curriculumId)}&facultyId=${encodeURIComponent(formData.facultyId)}&status=Active`,
        );
        const list = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setSectionMetaError(list?.message || 'Could not load scheduled sections.');
          setResolvedSectionId('');
          setSectionPreview(null);
          return;
        }
        if (!Array.isArray(list) || !list.length) {
          setResolvedSectionId('');
          setSectionPreview(null);
          setSectionScheduleNotice(
            'No active section in Scheduling yet. You can still save the syllabus; term and academic year will appear here once a section is assigned.',
          );
          return;
        }
        const pref = preferredSectionIdRef.current;
        const pick =
          pref && list.some((s) => String(s._id) === pref)
            ? list.find((s) => String(s._id) === pref)
            : list[0];
        const cur = pick.curriculumId && typeof pick.curriculumId === 'object' ? pick.curriculumId : null;
        setResolvedSectionId(pick._id);
        setSectionPreview({
          sectionIdentifier: pick.sectionIdentifier,
          term: pick.term,
          academicYear: pick.academicYear,
          curriculumYear: cur?.curriculumYear,
          creditUnits: cur?.creditUnits,
        });
      } catch {
        if (!cancelled) {
          setSectionMetaError('Network error while loading scheduled sections.');
          setSectionScheduleNotice('');
          setResolvedSectionId('');
          setSectionPreview(null);
        }
      } finally {
        if (!cancelled) setLoadingSection(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, isArchived, syllabusReady, editSyllabusId, formData.curriculumId, formData.facultyId]);

  const handleInputChange = useCallback((field, value) => {
    if (field === 'curriculumId' || field === 'facultyId') {
      preferredSectionIdRef.current = '';
      headerDirtyRef.current = true;
    }
    if (field === 'curriculumId') {
      setSelectedCloneId('');
      if (value) loadClonableSyllabi(value);
      else setClonableSyllabi([]);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, [loadClonableSyllabi]);

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

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.gradingSystem?.trim()) {
      newErrors.gradingSystem = 'Grading system is required';
    }
    if (!formData.coursePolicies?.trim()) {
      newErrors.coursePolicies = 'Course policies are required';
    }

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
    const valid = Object.keys(newErrors).length === 0;
    let firstErrorStep = 0;
    if (!valid) {
      if (newErrors.curriculumId || newErrors.facultyId) firstErrorStep = 0;
      else if (
        newErrors.description ||
        newErrors.gradingSystem ||
        newErrors.coursePolicies
      ) {
        firstErrorStep = 1;
      } else if (
        newErrors.weeklyLessons ||
        Object.keys(newErrors).some((k) => k.startsWith('weeklyLessons.'))
      ) {
        firstErrorStep = 2;
      } else {
        firstErrorStep = 1;
      }
    }
    return { valid, firstErrorStep };
  }, [formData]);

  const handleStepNext = useCallback(() => {
    setActiveStep((s) => Math.min(SYLLABUS_STEPS.length - 1, s + 1));
  }, []);

  const handleStepBack = useCallback(() => {
    setActiveStep((s) => Math.max(0, s - 1));
  }, []);

  const handleSubmit = useCallback(async (e) => {
      e.preventDefault();
      setFormError('');

      const { valid, firstErrorStep } = validateForm();
      if (!valid) {
        setActiveStep(firstErrorStep);
        requestAnimationFrame(() => {
          formRef.current?.querySelector('.field-error')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        });
        return;
      }

      const payload = {
        curriculumId: formData.curriculumId,
        facultyId: formData.facultyId,
        sectionId: resolvedSectionId || null,
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
  }, [formData, editSyllabusId, validateForm, onClose, onSuccess, resolvedSectionId]);

  const isEditMode = Boolean(editSyllabusId);
  const isDisabled = isArchived || submitting;

  const curriculaOptions = useMemo(
    () =>
      options.curricula.map((c) => ({
        value: c._id,
        label: `${c.courseCode || ''} — ${c.courseTitle || ''}`.trim() || String(c._id),
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

  const selectedCurriculum = useMemo(
    () => options.curricula.find((c) => String(c._id) === String(formData.curriculumId)),
    [options.curricula, formData.curriculumId]
  );

  const catalogCurriculumYear = selectedCurriculum?.curriculumYear ?? sectionPreview?.curriculumYear ?? '';
  const catalogCreditUnits = selectedCurriculum?.creditUnits ?? sectionPreview?.creditUnits;

  const stepProgressPct =
    ((activeStep + 1) / SYLLABUS_STEPS.length) * 100;

  /** Per-step completion for stepper visuals only (navigation is never blocked). */
  const stepCompleteFlags = useMemo(() => {
    const basicOk = Boolean(formData.curriculumId && formData.facultyId);
    const detailsOk = Boolean(
      formData.description?.trim() &&
        formData.gradingSystem?.trim() &&
        formData.coursePolicies?.trim()
    );
    const lessonsOk =
      Array.isArray(formData.weeklyLessons) &&
      formData.weeklyLessons.length >= 1 &&
      formData.weeklyLessons.every((l) => l.topic && String(l.topic).trim());
    return [basicOk, detailsOk, lessonsOk];
  }, [formData]);

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
            <div className="syllabus-modal-stepper" aria-label="Syllabus form steps">
              <div className="syllabus-stepper-track" aria-hidden="true">
                <div
                  className="syllabus-stepper-track-fill"
                  style={{ width: `${stepProgressPct}%` }}
                />
              </div>
              <div className="syllabus-tablist" role="tablist" aria-label="Syllabus sections">
                {SYLLABUS_STEPS.map((step, index) => {
                  const isActive = activeStep === index;
                  const isPast = activeStep > index;
                  const stepFilled = stepCompleteFlags[index];
                  const showCheck = isPast && stepFilled;
                  const showPastIncomplete = isPast && !stepFilled;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      role="tab"
                      id={`syllabus-tab-${step.id}`}
                      aria-selected={isActive}
                      tabIndex={isActive ? 0 : -1}
                      aria-controls={`syllabus-panel-${step.id}`}
                      title={
                        showPastIncomplete
                          ? `${step.label} — required fields not filled yet`
                          : undefined
                      }
                      className={`syllabus-tab ${isActive ? 'syllabus-tab--active' : ''} ${showCheck ? 'syllabus-tab--done' : ''} ${showPastIncomplete ? 'syllabus-tab--past-incomplete' : ''}`}
                      onClick={() => setActiveStep(index)}
                      disabled={submitting}
                    >
                      <span className="syllabus-tab-index" aria-hidden="true">
                        {showCheck ? '✓' : index + 1}
                      </span>
                      <span className="syllabus-tab-label">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ════════════════════════════════════════
                SECTION 1 — BASIC INFO
            ════════════════════════════════════════ */}
            {activeStep === 0 && (
            <section
              className="form-section"
              role="tabpanel"
              id="syllabus-panel-basic"
              aria-labelledby="syllabus-tab-basic"
            >
              <h3 className="form-section-title">Basic Info</h3>
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

                {/* Clone from existing (Smart Link) */}
                {!isEditMode && formData.curriculumId && clonableSyllabi.length > 0 && (
                  <div className="form-field form-field--highlight">
                    <label htmlFor="cloneSyllabusId" className="form-label">
                      Reuse content from... <span className="field-hint">(Optional: clones lesson plan & policies)</span>
                    </label>
                    <select
                      id="cloneSyllabusId"
                      className="form-select form-select--smart"
                      value={selectedCloneId}
                      onChange={(e) => handleCloneSelect(e.target.value)}
                      disabled={isDisabled}
                    >
                      <option value="">— Don't clone (Start from scratch) —</option>
                      {clonableSyllabi.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.sectionId?.sectionIdentifier || 'Previous'} ({s.sectionId?.term || 'N/A'}, {s.sectionId?.academicYear || 'N/A'}) — {s.facultyId?.lastName || 'Staff'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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

              <div className="syllabus-scheduling-panel">
                <p className="syllabus-scheduling-title">Schedule (from Scheduling)</p>
                <p className="syllabus-scheduling-hint">
                  Curriculum year and credit units come from the curriculum you select. Term and academic year come from the active section in Scheduling when one exists for this curriculum and faculty. There is no separate section dropdown. You can save without a schedule; section fields will fill in once Scheduling is set up.
                </p>
                {loadingSection ? (
                  <p className="syllabus-scheduling-muted">Resolving section…</p>
                ) : null}
                {sectionScheduleNotice && !sectionPreview ? (
                  <p className="syllabus-scheduling-notice" role="status">
                    {sectionScheduleNotice}
                  </p>
                ) : null}
                {formData.curriculumId && (selectedCurriculum || sectionPreview) ? (
                  <div className="syllabus-scheduling-readonly">
                    <div className="form-field">
                      <span className="form-label">Curriculum year (catalog)</span>
                      <input
                        className="form-input form-input--readonly"
                        readOnly
                        value={
                          catalogCurriculumYear != null && String(catalogCurriculumYear).trim()
                            ? String(catalogCurriculumYear)
                            : '—'
                        }
                      />
                    </div>
                    <div className="form-field">
                      <span className="form-label">Credit units (from curriculum)</span>
                      <input
                        className="form-input form-input--readonly"
                        readOnly
                        value={catalogCreditUnits != null ? String(catalogCreditUnits) : '—'}
                      />
                    </div>
                  </div>
                ) : null}
                {sectionPreview ? (
                  <div className="syllabus-scheduling-readonly syllabus-scheduling-readonly--section">
                    <div className="form-field">
                      <span className="form-label">Section</span>
                      <input className="form-input form-input--readonly" readOnly value={sectionPreview.sectionIdentifier || '—'} />
                    </div>
                    <div className="form-field">
                      <span className="form-label">Term</span>
                      <input className="form-input form-input--readonly" readOnly value={sectionPreview.term || '—'} />
                    </div>
                    <div className="form-field">
                      <span className="form-label">Academic year</span>
                      <input className="form-input form-input--readonly" readOnly value={sectionPreview.academicYear || '—'} />
                    </div>
                  </div>
                ) : null}
                {sectionMetaError ? (
                  <div className="syllabus-form-error syllabus-scheduling-error" role="alert">
                    {sectionMetaError}
                  </div>
                ) : null}
              </div>
            </section>
            )}

            {/* ════════════════════════════════════════
                SECTION 2 — COURSE DETAILS
            ════════════════════════════════════════ */}
            {activeStep === 1 && (
            <section
              className="form-section"
              role="tabpanel"
              id="syllabus-panel-details"
              aria-labelledby="syllabus-tab-details"
            >
              <h3 className="form-section-title">Course Details</h3>
              <div className="form-grid form-grid--single">

                {/* Description */}
                <div className="form-field">
                  <label htmlFor="description" className="form-label">
                    Description <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="description"
                    className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={isDisabled}
                    placeholder="Enter course description..."
                  />
                  {errors.description && (
                    <span className="field-error">{errors.description}</span>
                  )}
                </div>

                {/* Grading System */}
                <div className="form-field">
                  <label htmlFor="gradingSystem" className="form-label">
                    Grading System <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="gradingSystem"
                    className={`form-textarea ${errors.gradingSystem ? 'input-error' : ''}`}
                    rows={3}
                    value={formData.gradingSystem}
                    onChange={(e) => handleInputChange('gradingSystem', e.target.value)}
                    disabled={isDisabled}
                    placeholder="Describe the grading system..."
                  />
                  {errors.gradingSystem && (
                    <span className="field-error">{errors.gradingSystem}</span>
                  )}
                </div>

                {/* Course Policies */}
                <div className="form-field">
                  <label htmlFor="coursePolicies" className="form-label">
                    Course Policies <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="coursePolicies"
                    className={`form-textarea ${errors.coursePolicies ? 'input-error' : ''}`}
                    rows={3}
                    value={formData.coursePolicies}
                    onChange={(e) => handleInputChange('coursePolicies', e.target.value)}
                    disabled={isDisabled}
                    placeholder="Enter course policies..."
                  />
                  {errors.coursePolicies && (
                    <span className="field-error">{errors.coursePolicies}</span>
                  )}
                </div>

              </div>
            </section>
            )}

            {/* ════════════════════════════════════════
                SECTION 3 — LESSON PLAN
            ════════════════════════════════════════ */}
            {activeStep === 2 && (
            <section
              className="form-section"
              role="tabpanel"
              id="syllabus-panel-lessons"
              aria-labelledby="syllabus-tab-lessons"
            >
              <div className="form-section-header">
                <h3 className="form-section-title">Lesson Plan</h3>
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
            )}

            {/* ════════════════════════════════════════
                FORM FOOTER — ACTION BUTTONS
            ════════════════════════════════════════ */}
            <div className="modal-footer syllabus-modal-footer">
              <div className="syllabus-modal-footer-left">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>

              <div className="syllabus-modal-footer-right">
                {activeStep > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary syllabus-footer-back"
                    onClick={handleStepBack}
                    disabled={submitting}
                  >
                    <FiChevronLeft aria-hidden />
                    Back
                  </button>
                )}

                {activeStep < SYLLABUS_STEPS.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary syllabus-footer-next"
                    onClick={handleStepNext}
                    disabled={submitting}
                  >
                    Next
                    <FiChevronRight aria-hidden />
                  </button>
                ) : (
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
                )}
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default AddEditSyllabusModal;