import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../api";
import "../styles/AddStudentForm.css";

const SKILL_OPTIONS = [
  { value: 'Programming', label: 'Programming' },
  { value: 'Web Development', label: 'Web Development' },
  { value: 'Database Management', label: 'Database Management' },
  { value: 'UI/UX Design', label: 'UI/UX Design' },
  { value: 'Data Analysis', label: 'Data Analysis' },
  { value: 'Communication', label: 'Communication' },
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Problem Solving', label: 'Problem Solving' },
];

const SCHOLARSHIP_OPTIONS = [
  'Academic Scholar',
  "Dean's Lister",
  'CHED Scholar',
  'Athletic Grant',
  'Industry Partner',
  'None',
];
const URL_REGEX = /^https?:\/\/\S+$/i;
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function getSectionOptions(program, yearLevel) {
  const programMap = {
    BSCS: 'CS',
    BSIT: 'IT',
    BSIS: 'IS',
  };

  const prefix = programMap[String(program || '').trim()];
  const year = String(yearLevel || '').trim();
  if (!prefix || !year) return [];
  if (!['1', '2', '3', '4'].includes(year)) return [];

  return ['A', 'B', 'C'].map((suffix) => `${prefix}${year}${suffix}`);
}

const emptyForm = {
  id: '',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  dob: '',
  program: '',
  yearLevel: '',
  section: '',
  status: '',
  scholarship: '',
  profileAvatar: '',
  email: '',
  contact: '',
  dateEnrolled: '',
  guardian: '',
  guardianContact: '',
  violation: '',
  skills: [],
};

function isNonEmpty(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function isValidEmail(value) {
  const v = String(value || '').trim();
  if (!v) return true; // optional
  // Simple, pragmatic email check.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(value) {
  const v = String(value || '').trim();
  if (!v) return true; // optional
  return /^09\d{9}$/.test(v);
}

function isValidAvatarValue(value) {
  const avatar = String(value || '').trim();
  if (!avatar) return true;
  if (avatar.startsWith('data:image/')) return true;
  return URL_REGEX.test(avatar);
}

function mapStudentToFormData(student) {
  return {
    id: String(student?.id ?? ''),
    firstName: String(student?.firstName ?? ''),
    middleName: String(student?.middleName ?? ''),
    lastName: String(student?.lastName ?? ''),
    gender: String(student?.gender ?? ''),
    dob: String(student?.dob ?? ''),
    program: String(student?.program ?? ''),
    yearLevel: String(student?.yearLevel ?? ''),
    section: String(student?.section ?? ''),
    status: String(student?.status ?? ''),
    scholarship: String(student?.scholarship ?? ''),
    profileAvatar: String(student?.profileAvatar ?? ''),
    email: String(student?.email ?? ''),
    contact: String(student?.contact ?? ''),
    dateEnrolled: String(student?.dateEnrolled ?? ''),
    guardian: String(student?.guardian ?? ''),
    guardianContact: String(student?.guardianContact ?? ''),
    violation: String(student?.violation ?? ''),
    skills: Array.isArray(student?.skills) ? student.skills : [],
  };
}

export default function AddStudentForm({
  mode = 'create',
  initialData,
  nextStudentId,
  targetMongoId,
  onCreated,
  onUpdated,
  onClose,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [avatarInputMode, setAvatarInputMode] = useState('url');

  const controlClass = 'add-student-control mt-1 block';
  const labelClass = 'add-student-label';

  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData(mapStudentToFormData(initialData));
    } else {
      setFormData({
        ...emptyForm,
        id: nextStudentId || '',
      });
    }
    setErrors({});
    setSubmitError('');
    setSubmitting(false);
    setShowPreview(false);
  }, [isEditMode, initialData, nextStudentId]);

  useEffect(() => {
    const avatar = String(formData.profileAvatar || '').trim();
    if (!avatar) {
      setAvatarInputMode('url');
      return;
    }
    if (avatar.startsWith('data:image/')) {
      setAvatarInputMode('upload');
      return;
    }
    setAvatarInputMode('url');
  }, [formData.profileAvatar]);

  const availableSections = useMemo(
    () => getSectionOptions(formData.program, formData.yearLevel),
    [formData.program, formData.yearLevel],
  );

  useEffect(() => {
    if (!formData.section) return;
    if (!availableSections.includes(formData.section)) {
      setFormData((prev) => ({ ...prev, section: '' }));
    }
  }, [availableSections, formData.section]);

  const validationRules = useMemo(() => {
    const base = [
      { key: 'firstName', label: 'First Name', required: true },
      { key: 'lastName', label: 'Last Name', required: true },
      { key: 'program', label: 'Program', required: true },
      { key: 'yearLevel', label: 'Year Level', required: true },
      { key: 'section', label: 'Section', required: true },
      { key: 'status', label: 'Enrollment Status', required: true },
      { key: 'email', label: 'Email Address', required: true },
      { key: 'contact', label: 'Contact Number', required: true },
      { key: 'dateEnrolled', label: 'Date Enrolled', required: true },
      { key: 'guardian', label: 'Guardian', required: true },
      { key: 'guardianContact', label: 'Guardian Contact Information', required: true },
    ];
    if (isEditMode) {
      return [{ key: 'id', label: 'Student ID', required: true }, ...base];
    }
    return base;
  }, [isEditMode]);

  const validate = () => {
    const next = {};
    for (const rule of validationRules) {
      if (rule.required && !isNonEmpty(formData[rule.key])) {
        next[rule.key] = `${rule.label} is required.`;
      }
    }

    if (!isValidEmail(formData.email)) {
      next.email = 'Enter a valid email address.';
    }

    if (!isValidPhone(formData.contact)) {
      next.contact = 'Contact number must start with 09 and contain 11 digits.';
    }

    if (!isValidPhone(formData.guardianContact)) {
      next.guardianContact = 'Guardian contact must start with 09 and contain 11 digits.';
    }

    if (isNonEmpty(formData.yearLevel) && !/^[0-9]{1,2}$/.test(String(formData.yearLevel).trim())) {
      next.yearLevel = 'Year Level must be a number (e.g., 1, 2, 3, 4).';
    }

    if (!isValidAvatarValue(formData.profileAvatar)) {
      next.profileAvatar = 'Profile Avatar must be a valid URL or uploaded image.';
    }

    return next;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitToServer = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      if (isEditMode && !targetMongoId) {
        setSubmitError('Missing student identifier for editing.');
        return;
      }

      const res = await apiFetch(isEditMode ? `/api/students/${targetMongoId}` : '/api/students', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => null);

      if ((isEditMode ? 200 : 201) === res.status && data) {
        toast.success(
          isEditMode
            ? "Student details successfully updated!"
            : "Student successfully added!",
        );
        if (isEditMode) onUpdated?.(data);
        else onCreated?.(data);
        setFormData(emptyForm);
        setErrors({});
        setShowPreview(false);
        onClose?.();
        return;
      }

      if (res.status === 400) {
        setSubmitError(data?.message || 'Please review the form and try again.');
        return;
      }

      setSubmitError('Something went wrong. Please try again in a moment.');
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!isEditMode && !formData.id) {
      setSubmitError('Student ID is not ready yet. Please try again.');
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!isEditMode) {
      setShowPreview(true);
      return;
    }

    await submitToServer();
  };

  const FieldError = ({ name }) => {
    if (!errors[name]) return null;
    return <p className="mt-1 text-sm text-red-600">{errors[name]}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl add-student-dialog">
        <div className="flex items-center justify-between border-b bg-slate-50 add-student-header">
          <div>
            <p className="add-student-eyebrow">{isEditMode ? 'Student Details' : 'New Student'}</p>
            <h3 className="add-student-title">{isEditMode ? 'Edit Student' : 'Add Student'}</h3>
            <p className="add-student-subtitle">
              {isEditMode ? 'Update the student details and save changes.' : 'Fill in the required student details.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="add-student-close"
            aria-label="Close form"
          >
            &#x2715;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
          <div className="add-student-form-body">
            {submitError ? (
              <div className="mb-5 px-4 py-3 text-sm add-student-error">
                {submitError}
              </div>
            ) : null}

            {!showPreview ? (
            <div className="add-student-grid">
            <div>
              <label htmlFor="id" className={labelClass}>
                Student ID {isEditMode ? <span className="text-red-600">*</span> : null}
              </label>
              <input
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className={controlClass}
                placeholder={isEditMode ? 'e.g., 2201001' : 'Auto-generated (e.g., 2201001)'}
                autoComplete="off"
                readOnly={!isEditMode}
                aria-invalid={Boolean(errors.id)}
              />
              <FieldError name="id" />
            </div>

            <div>
              <label htmlFor="firstName" className={labelClass}>
                First Name <span className="text-red-600">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={controlClass}
                placeholder="e.g., Althea"
                autoComplete="off"
                aria-invalid={Boolean(errors.firstName)}
              />
              <FieldError name="firstName" />
            </div>

            <div>
              <label htmlFor="middleName" className={labelClass}>
                Middle Name
              </label>
              <input
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className={controlClass}
                placeholder="Optional"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="lastName" className={labelClass}>
                Last Name <span className="text-red-600">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={controlClass}
                placeholder="e.g., Santos"
                autoComplete="off"
                aria-invalid={Boolean(errors.lastName)}
              />
              <FieldError name="lastName" />
            </div>

            <div>
              <label htmlFor="gender" className={labelClass}>
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={controlClass}
              >
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <div>
              <label htmlFor="dob" className={labelClass}>
                Date of Birth
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                className={controlClass}
              />
            </div>

                <div>
                  <label htmlFor="program" className={labelClass}>
                    Program / Course <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className={controlClass}
                    aria-invalid={Boolean(errors.program)}>
                    <option value="">Select program</option>
                    <option value="BSCS">BSCS</option>
                    <option value="BSIT">BSIT</option>
                  </select>
                  <FieldError name="program" />
                </div>

            <div>
              <label htmlFor="yearLevel" className={labelClass}>
                Year Level <span className="text-red-600">*</span>
              </label>
              <select
                id="yearLevel"
                name="yearLevel"
                value={formData.yearLevel}
                onChange={handleChange}
                className={controlClass}
                aria-invalid={Boolean(errors.yearLevel)}
              >
                <option value="">Select year level</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              <FieldError name="yearLevel" />
            </div>

            <div>
              <label htmlFor="section" className={labelClass}>
                Section <span className="text-red-600">*</span>
              </label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className={controlClass}
                aria-invalid={Boolean(errors.section)}
                disabled={!formData.program || !formData.yearLevel}
              >
                <option value="">
                  {!formData.program || !formData.yearLevel
                    ? 'Select program and year level first'
                    : 'Select section'}
                </option>
                {availableSections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
              <FieldError name="section" />
            </div>

            <div>
              <label htmlFor="status" className={labelClass}>
                Enrollment Status <span className="text-red-600">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={controlClass}
              >
                <option value="">Select</option>
                <option value="Enrolled">Enrolled</option>
                <option value="On Leave">On Leave</option>
                <option value="Graduating">Graduating</option>
              </select>
            </div>

            <div>
              <label htmlFor="scholarship" className={labelClass}>
                Scholarship
              </label>
              <select
                id="scholarship"
                name="scholarship"
                value={formData.scholarship}
                onChange={handleChange}
                className={controlClass}
              >
                <option value="">Select scholarship (optional)</option>
                {SCHOLARSHIP_OPTIONS.map((scholarship) => (
                  <option key={scholarship} value={scholarship}>
                    {scholarship}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="profileAvatar" className={labelClass}>
                Profile Avatar
              </label>
              <div className="avatar-input-mode">
                <label className="avatar-input-option">
                  <input
                    type="radio"
                    name="avatarInputMode"
                    value="url"
                    checked={avatarInputMode === 'url'}
                    onChange={() => setAvatarInputMode('url')}
                  />
                  <span>URL</span>
                </label>
                <label className="avatar-input-option">
                  <input
                    type="radio"
                    name="avatarInputMode"
                    value="upload"
                    checked={avatarInputMode === 'upload'}
                    onChange={() => setAvatarInputMode('upload')}
                  />
                  <span>Upload</span>
                </label>
              </div>
              {avatarInputMode === 'url' ? (
                <input
                  id="profileAvatar"
                  name="profileAvatar"
                  type="url"
                  value={formData.profileAvatar}
                  onChange={handleChange}
                  className={controlClass}
                  placeholder="https://example.com/avatar.jpg"
                  autoComplete="off"
                />
              ) : (
                <input
                  id="profileAvatarUpload"
                  name="profileAvatarUpload"
                  type="file"
                  accept="image/*"
                  className={controlClass}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!IMAGE_MIME_TYPES.includes(file.type)) {
                      setErrors((prev) => ({
                        ...prev,
                        profileAvatar: 'Unsupported image type. Use JPG, PNG, WEBP, or GIF.',
                      }));
                      return;
                    }
                    if (file.size > MAX_AVATAR_BYTES) {
                      setErrors((prev) => ({
                        ...prev,
                        profileAvatar: 'Image is too large. Maximum file size is 2MB.',
                      }));
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = String(reader.result || '');
                      if (result.startsWith('data:image/')) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.profileAvatar;
                          return next;
                        });
                        setFormData((prev) => ({ ...prev, profileAvatar: result }));
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              )}
              <FieldError name="profileAvatar" />
              {formData.profileAvatar ? (
                <div className="avatar-preview-wrap">
                  <img className="avatar-preview-img" src={formData.profileAvatar} alt="Student avatar preview" />
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email Address <span className="text-red-600">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={controlClass}
                placeholder="name@example.com"
                autoComplete="off"
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError name="email" />
            </div>

            <div>
              <label htmlFor="contact" className={labelClass}>
                Contact Number <span className="text-red-600">*</span>
              </label>
              <input
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className={controlClass}
                placeholder="09XXXXXXXXX"
                autoComplete="off"
                aria-invalid={Boolean(errors.contact)}
              />
              <FieldError name="contact" />
            </div>

            <div>
              <label htmlFor="dateEnrolled" className={labelClass}>
                Date Enrolled <span className="text-red-600">*</span>
              </label>
              <input
                id="dateEnrolled"
                name="dateEnrolled"
                type="date"
                value={formData.dateEnrolled}
                onChange={handleChange}
                className={controlClass}
              />
            </div>

            <div>
              <label htmlFor="guardian" className={labelClass}>
                Guardian <span className="text-red-600">*</span>
              </label>
              <input
                id="guardian"
                name="guardian"
                value={formData.guardian}
                onChange={handleChange}
                className={controlClass}
                placeholder="Optional"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="guardianContact" className={labelClass}>
                Guardian Contact Information <span className="text-red-600">*</span>
              </label>
              <input
                id="guardianContact"
                name="guardianContact"
                value={formData.guardianContact}
                onChange={handleChange}
                className={controlClass}
                placeholder="Optional"
                autoComplete="off"
                aria-invalid={Boolean(errors.guardianContact)}
              />
              <FieldError name="guardianContact" />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="violation" className={labelClass}>
                Violation
              </label>
              <select
                id="violation"
                name="violation"
                value={formData.violation}
                onChange={handleChange}
                className={controlClass}
              >
                <option value="">Select violation</option>
                <option value="None">None</option>
                <option value="Warning (late)">Warning (late)</option>
                <option value="Academic probation">Academic probation</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="skills" className={labelClass}>
                Skills
              </label>
              <div className="skills-grid">
                {SKILL_OPTIONS.map((skill) => {
                  const isChecked = formData.skills.includes(skill.value);
                  return (
                    <label key={skill.value} className={`skill-checkbox ${isChecked ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        value={skill.value}
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill.value] }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              skills: prev.skills.filter((s) => s !== skill.value),
                            }));
                          }
                        }}
                      />
                      <span>{skill.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
            ) : (
              <div className="preview-card">
                <h4 className="preview-title">Preview Student Details</h4>
                <p className="preview-subtitle">Please review everything before adding this student.</p>
                <div className="preview-grid">
                  <div className="preview-item"><span className="preview-label">Student ID</span><span className="preview-value">{formData.id}</span></div>
                  <div className="preview-item"><span className="preview-label">First Name</span><span className="preview-value">{formData.firstName}</span></div>
                  <div className="preview-item"><span className="preview-label">Middle Name</span><span className="preview-value">{formData.middleName || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Last Name</span><span className="preview-value">{formData.lastName}</span></div>
                  <div className="preview-item"><span className="preview-label">Gender</span><span className="preview-value">{formData.gender || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Date of Birth</span><span className="preview-value">{formData.dob || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Program</span><span className="preview-value">{formData.program}</span></div>
                  <div className="preview-item"><span className="preview-label">Year Level</span><span className="preview-value">{formData.yearLevel}</span></div>
                  <div className="preview-item"><span className="preview-label">Section</span><span className="preview-value">{formData.section || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Enrollment Status</span><span className="preview-value">{formData.status || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Scholarship</span><span className="preview-value">{formData.scholarship || '-'}</span></div>
                  <div className="preview-item preview-item-full"><span className="preview-label">Profile Avatar</span><span className="preview-value">{formData.profileAvatar || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Email</span><span className="preview-value">{formData.email || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Contact</span><span className="preview-value">{formData.contact || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Date Enrolled</span><span className="preview-value">{formData.dateEnrolled || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Guardian</span><span className="preview-value">{formData.guardian || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Guardian Contact</span><span className="preview-value">{formData.guardianContact || '-'}</span></div>
                  <div className="preview-item preview-item-full"><span className="preview-label">Violation</span><span className="preview-value">{formData.violation || '-'}</span></div>
                  <div className="preview-item preview-item-full"><span className="preview-label">Skills</span><span className="preview-value">{formData.skills.length ? formData.skills.join(', ') : '-'}</span></div>
                </div>
              </div>
            )}

          <div className="add-student-actions">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={showPreview ? () => setShowPreview(false) : onClose}
                  className="add-student-btn add-student-secondary"
                disabled={submitting}
              >
                {showPreview ? 'Back to Edit' : 'Cancel'}
              </button>

              <button
                type={showPreview && !isEditMode ? 'button' : 'submit'}
                onClick={showPreview && !isEditMode ? submitToServer : undefined}
                disabled={submitting}
                  className="add-student-btn add-student-primary"
              >
                {submitting
                  ? (isEditMode ? 'Saving...' : 'Adding...')
                  : isEditMode
                    ? 'Save Changes'
                    : showPreview
                      ? 'Add Student'
                      : 'Review Details'}
              </button>
            </div>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}
