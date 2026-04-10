import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';
import '../styles/AddFacultyForm.css';

const emptyForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  department: '',
  profileAvatar: '',
  institutionalEmail: '',
  personalEmail: '',
  mobileNumber: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  position: '',
  employmentType: '',
  contractType: '',
  dateHired: '',
  highestEducation: '',
  fieldOfStudy: '',
  certifications: '',
};

const PH_MOBILE_REGEX = /^09\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/\S+$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const CERTIFICATION_SUGGESTIONS = [
  'AWS Certified Cloud Practitioner',
  'Cisco CCNA',
  'CompTIA Security+',
  'Google Data Analytics Certificate',
  'Microsoft Azure Fundamentals (AZ-900)',
  'TESDA NC II',
];

function isNonEmpty(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function isValidAvatarValue(value) {
  const avatar = String(value || '').trim();
  if (!avatar) return true;
  if (avatar.startsWith('data:image/')) return true;
  return URL_REGEX.test(avatar);
}

function yearsOfServiceFromDateHired(dateHired) {
  const value = String(dateHired || '').trim();
  if (!DATE_REGEX.test(value)) return 0;

  const hiredDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(hiredDate.getTime())) return 0;

  const now = new Date();
  let years = now.getUTCFullYear() - hiredDate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - hiredDate.getUTCMonth();
  const dayDiff = now.getUTCDate() - hiredDate.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years -= 1;
  return Math.max(0, years);
}

export default function AddFacultyForm({
  mode = 'create',
  initialData = null,
  targetEmployeeId = '',
  onClose,
  onCreated,
  onUpdated,
  nextEmployeeId = '',
}) {
  const isEditMode = mode === 'edit';
  const [formData, setFormData] = useState(emptyForm);
  const [originalUpdatedAt, setOriginalUpdatedAt] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [avatarInputMode, setAvatarInputMode] = useState('url');

  const controlClass = 'add-student-control mt-1 block';
  const labelClass = 'add-student-label';

  const yearsOfService = useMemo(
    () => yearsOfServiceFromDateHired(formData.dateHired),
    [formData.dateHired],
  );

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        firstName: String(initialData.firstName || ''),
        middleName: String(initialData.middleName || ''),
        lastName: String(initialData.lastName || ''),
        dob: String(initialData.dob || ''),
        department: String(initialData.department || ''),
        profileAvatar: String(initialData.profileAvatar || ''),
        institutionalEmail: String(initialData.institutionalEmail || ''),
        personalEmail: String(initialData.personalEmail || ''),
        mobileNumber: String(initialData.mobileNumber || ''),
        emergencyContactName: String(initialData.emergencyContactName || ''),
        emergencyContactNumber: String(initialData.emergencyContactNumber || ''),
        position: String(initialData.position || ''),
        employmentType: String(initialData.employmentType || ''),
        contractType: String(initialData.contractType || ''),
        dateHired: String(initialData.dateHired || ''),
        highestEducation: String(initialData.highestEducation || ''),
        fieldOfStudy: String(initialData.fieldOfStudy || ''),
        certifications: String(initialData.certifications || ''),
      });
      setOriginalUpdatedAt(String(initialData.updatedAt || ''));
    } else {
      setFormData(emptyForm);
      setOriginalUpdatedAt('');
    }
    setErrors({});
    setSubmitError('');
    setSubmitting(false);
    setShowPreview(false);
  }, [isEditMode, initialData]);

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

  const validate = () => {
    const next = {};
    const requiredFields = [
      ['firstName', 'First Name'],
      ['lastName', 'Last Name'],
      ['dob', 'Date of Birth'],
      ['department', 'Department'],
      ['institutionalEmail', 'Institutional Email'],
      ['mobileNumber', 'Mobile Number'],
      ['position', 'Position'],
      ['employmentType', 'Employment Type'],
      ['dateHired', 'Date Hired'],
      ['highestEducation', 'Highest Educational Attainment'],
      ['fieldOfStudy', 'Field of Study'],
    ];

    requiredFields.forEach(([key, label]) => {
      if (!isNonEmpty(formData[key])) {
        next[key] = `${label} is required.`;
      }
    });

    if (isNonEmpty(formData.institutionalEmail) && !EMAIL_REGEX.test(formData.institutionalEmail.trim())) {
      next.institutionalEmail = 'Enter a valid institutional email address.';
    }

    if (isNonEmpty(formData.personalEmail) && !EMAIL_REGEX.test(formData.personalEmail.trim())) {
      next.personalEmail = 'Enter a valid personal email address.';
    }

    if (isNonEmpty(formData.mobileNumber) && !PH_MOBILE_REGEX.test(formData.mobileNumber.trim())) {
      next.mobileNumber = 'Mobile number must start with 09 and contain 11 digits.';
    }

    if (
      isNonEmpty(formData.emergencyContactNumber) &&
      !PH_MOBILE_REGEX.test(formData.emergencyContactNumber.trim())
    ) {
      next.emergencyContactNumber = 'Emergency contact number must start with 09 and contain 11 digits.';
    }

    if (!isValidAvatarValue(formData.profileAvatar)) {
      next.profileAvatar = 'Profile Avatar must be a valid URL or uploaded image.';
    }

    if (isNonEmpty(formData.dob) && !DATE_REGEX.test(formData.dob.trim())) {
      next.dob = 'Date of Birth must be in YYYY-MM-DD format.';
    }

    if (isNonEmpty(formData.dateHired) && !DATE_REGEX.test(formData.dateHired.trim())) {
      next.dateHired = 'Date Hired must be in YYYY-MM-DD format.';
    }

    if (isNonEmpty(formData.department) && !['IT', 'CS'].includes(formData.department)) {
      next.department = 'Department must be IT or CS.';
    }

    if (
      isNonEmpty(formData.employmentType) &&
      !['Full-time', 'Part-time'].includes(formData.employmentType)
    ) {
      next.employmentType = 'Employment Type must be Full-time or Part-time.';
    }

    return next;
  };

  const FieldError = ({ name }) => {
    if (!errors[name]) return null;
    return <p className="mt-1 text-sm text-red-600">{errors[name]}</p>;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCertificationSuggestion = (suggestion) => {
    setFormData((prev) => {
      const current = String(prev.certifications || '').trim();
      if (!current) {
        return { ...prev, certifications: suggestion };
      }

      const parts = current
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (parts.some((item) => item.toLowerCase() === suggestion.toLowerCase())) {
        return prev;
      }

      return {
        ...prev,
        certifications: `${current}, ${suggestion}`,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (isEditMode) {
      submitToServer();
      return;
    }
    setShowPreview(true);
  };

  const submitToServer = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        ...formData,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        dob: formData.dob.trim(),
        department: formData.department,
        profileAvatar: formData.profileAvatar.trim(),
        institutionalEmail: formData.institutionalEmail.trim(),
        personalEmail: formData.personalEmail.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactNumber: formData.emergencyContactNumber.trim(),
        position: formData.position.trim(),
        employmentType: formData.employmentType,
        contractType: formData.contractType.trim(),
        dateHired: formData.dateHired.trim(),
        highestEducation: formData.highestEducation,
        fieldOfStudy: formData.fieldOfStudy.trim(),
        certifications: formData.certifications.trim(),
      };

      if (isEditMode && originalUpdatedAt) {
        payload.updatedAt = originalUpdatedAt;
      }

      const res = await apiFetch(isEditMode ? `/api/faculty/${targetEmployeeId}` : '/api/faculty', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if ((isEditMode ? res.status === 200 : res.status === 201) && data) {
        setFormData(emptyForm);
        setErrors({});
        setShowPreview(false);
        if (isEditMode) onUpdated?.(data);
        else onCreated?.(data);
        onClose?.();
        return;
      }

      if (res.status === 400) {
        if (data?.message && data.message.toLowerCase().includes('institutionalemail')) {
          setErrors((prev) => ({ ...prev, institutionalEmail: data.message }));
          setSubmitError('');
        } else {
          setSubmitError(data?.message || 'Please review the form and try again.');
        }
        return;
      }

      if (res.status === 409) {
        setSubmitError(data?.message || 'This record was modified by another user. Please refresh and try again.');
        return;
      }

      if (data?.message) {
        setSubmitError(data.message);
        return;
      }

      setSubmitError(`Request failed (${res.status}). Please try again in a moment.`);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl add-student-dialog">
        <div className="flex items-center justify-between border-b bg-slate-50 add-student-header">
          <div>
            <p className="add-student-eyebrow">Faculty Directory</p>
            <h3 className="add-student-title">{isEditMode ? 'Edit Faculty' : 'Add New Faculty'}</h3>
            <p className="add-student-subtitle">
              {isEditMode
                ? 'Update details and save changes.'
                : 'Complete all required fields before review and confirmation.'}
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
              <div className="mb-5 px-4 py-3 text-sm add-student-error">{submitError}</div>
            ) : null}

            {!showPreview || isEditMode ? (
              <div className="add-student-grid">
                <section className="faculty-section">
                  <h4 className="faculty-section-title">Personal Information</h4>
                  <div className="faculty-section-grid">
                    <div>
                      <label htmlFor="employeeIdPlaceholder" className={labelClass}>Employee ID</label>
                      <input
                        id="employeeIdPlaceholder"
                        value={isEditMode ? targetEmployeeId || '' : nextEmployeeId || ''}
                        readOnly
                        className={controlClass}
                      />
                      <p className="faculty-readonly-note">
                        {isEditMode
                          ? 'Employee ID is read-only and cannot be changed.'
                          : 'Preview of next ID. Backend confirms final value.'}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="firstName" className={labelClass}>First Name <span className="text-red-600">*</span></label>
                      <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={controlClass} />
                      <FieldError name="firstName" />
                    </div>
                    <div>
                      <label htmlFor="middleName" className={labelClass}>Middle Name</label>
                      <input id="middleName" name="middleName" value={formData.middleName} onChange={handleChange} className={controlClass} />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelClass}>Last Name <span className="text-red-600">*</span></label>
                      <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={controlClass} />
                      <FieldError name="lastName" />
                    </div>
                    <div>
                      <label htmlFor="dob" className={labelClass}>Date of Birth <span className="text-red-600">*</span></label>
                      <input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} className={controlClass} />
                      <FieldError name="dob" />
                    </div>
                    <div>
                      <label htmlFor="department" className={labelClass}>Department <span className="text-red-600">*</span></label>
                      <select id="department" name="department" value={formData.department} onChange={handleChange} className={controlClass}>
                        <option value="">Select department</option>
                        <option value="IT">IT</option>
                        <option value="CS">CS</option>
                      </select>
                      <FieldError name="department" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="profileAvatar" className={labelClass}>Profile Avatar</label>
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
                          placeholder="https://example.com/avatar.png"
                          value={formData.profileAvatar}
                          onChange={handleChange}
                          className={controlClass}
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
                          <img className="avatar-preview-img" src={formData.profileAvatar} alt="Faculty avatar preview" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="faculty-section">
                  <h4 className="faculty-section-title">Contact Information</h4>
                  <div className="faculty-section-grid">
                    <div>
                      <label htmlFor="institutionalEmail" className={labelClass}>Institutional Email <span className="text-red-600">*</span></label>
                      <input id="institutionalEmail" name="institutionalEmail" type="email" value={formData.institutionalEmail} onChange={handleChange} className={controlClass} />
                      <FieldError name="institutionalEmail" />
                    </div>
                    <div>
                      <label htmlFor="personalEmail" className={labelClass}>Personal Email</label>
                      <input id="personalEmail" name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} className={controlClass} />
                      <FieldError name="personalEmail" />
                    </div>
                    <div>
                      <label htmlFor="mobileNumber" className={labelClass}>Mobile Number <span className="text-red-600">*</span></label>
                      <input id="mobileNumber" name="mobileNumber" type="tel" placeholder="09XXXXXXXXX" value={formData.mobileNumber} onChange={handleChange} className={controlClass} />
                      <FieldError name="mobileNumber" />
                    </div>
                    <div>
                      <label htmlFor="emergencyContactName" className={labelClass}>Emergency Contact Name</label>
                      <input id="emergencyContactName" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className={controlClass} />
                    </div>
                    <div>
                      <label htmlFor="emergencyContactNumber" className={labelClass}>Emergency Contact Number</label>
                      <input id="emergencyContactNumber" name="emergencyContactNumber" type="tel" placeholder="09XXXXXXXXX" value={formData.emergencyContactNumber} onChange={handleChange} className={controlClass} />
                      <FieldError name="emergencyContactNumber" />
                    </div>
                  </div>
                </section>

                <section className="faculty-section">
                  <h4 className="faculty-section-title">Employment Details</h4>
                  <div className="faculty-section-grid">
                    <div>
                      <label htmlFor="position" className={labelClass}>Position <span className="text-red-600">*</span></label>
                      <select id="position" name="position" value={formData.position} onChange={handleChange} className={controlClass}>
                        <option value="">Select position</option>
                        <option value="Instructor">Instructor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Program Coordinator">Program Coordinator</option>
                        <option value="Department Chair">Department Chair</option>
                        <option value="Dean">Dean</option>
                      </select>
                      <FieldError name="position" />
                    </div>
                    <div>
                      <label htmlFor="employmentType" className={labelClass}>Employment Type <span className="text-red-600">*</span></label>
                      <select id="employmentType" name="employmentType" value={formData.employmentType} onChange={handleChange} className={controlClass}>
                        <option value="">Select employment type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                      <FieldError name="employmentType" />
                    </div>
                    <div>
                      <label htmlFor="contractType" className={labelClass}>Contract Type</label>
                      <select id="contractType" name="contractType" value={formData.contractType} onChange={handleChange} className={controlClass}>
                        <option value="">Select contract type</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Probationary">Probationary</option>
                        <option value="Contractual">Contractual</option>
                        <option value="Visiting">Visiting</option>
                        <option value="Adjunct">Adjunct</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dateHired" className={labelClass}>Date Hired <span className="text-red-600">*</span></label>
                      <input id="dateHired" name="dateHired" type="date" value={formData.dateHired} onChange={handleChange} className={controlClass} />
                      <FieldError name="dateHired" />
                    </div>
                    <div>
                      <label htmlFor="yearsOfServicePreview" className={labelClass}>Years of Service</label>
                      <input id="yearsOfServicePreview" value={String(yearsOfService)} readOnly className={controlClass} />
                    </div>
                  </div>
                </section>

                <section className="faculty-section">
                  <h4 className="faculty-section-title">Academic Qualifications</h4>
                  <div className="faculty-section-grid">
                    <div>
                      <label htmlFor="highestEducation" className={labelClass}>Highest Educational Attainment <span className="text-red-600">*</span></label>
                      <select id="highestEducation" name="highestEducation" value={formData.highestEducation} onChange={handleChange} className={controlClass}>
                        <option value="">Select attainment</option>
                        <option value="Bachelor's">Bachelor&apos;s</option>
                        <option value="Master's">Master&apos;s</option>
                        <option value="Doctorate">Doctorate</option>
                        <option value="PhD Candidate">PhD Candidate</option>
                      </select>
                      <FieldError name="highestEducation" />
                    </div>
                    <div>
                      <label htmlFor="fieldOfStudy" className={labelClass}>Field of Study <span className="text-red-600">*</span></label>
                      <select id="fieldOfStudy" name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleChange} className={controlClass}>
                        <option value="">Select field of study</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Information Systems">Information Systems</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="Educational Technology">Educational Technology</option>
                      </select>
                      <FieldError name="fieldOfStudy" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="certifications" className={labelClass}>Certifications / Licenses</label>
                      <textarea id="certifications" name="certifications" rows="3" value={formData.certifications} onChange={handleChange} className={controlClass} />
                      <div className="faculty-suggestions">
                        {CERTIFICATION_SUGGESTIONS.map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="faculty-suggestion-chip"
                            onClick={() => handleAddCertificationSuggestion(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="preview-card">
                <h4 className="preview-title">Preview Faculty Profile</h4>
                <p className="preview-subtitle">Please review all sections before creating this faculty record.</p>
                <div className="preview-grid">
                  <div className="preview-item preview-item-full"><span className="preview-label">Personal Information</span><span className="preview-value">Employee ID: {targetEmployeeId || nextEmployeeId || '-'} | Name: {formData.firstName} {formData.middleName || ''} {formData.lastName}</span></div>
                  <div className="preview-item"><span className="preview-label">Date of Birth</span><span className="preview-value">{formData.dob || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Department</span><span className="preview-value">{formData.department || '-'}</span></div>
                  <div className="preview-item preview-item-full"><span className="preview-label">Profile Avatar</span><span className="preview-value">{formData.profileAvatar || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Institutional Email</span><span className="preview-value">{formData.institutionalEmail || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Personal Email</span><span className="preview-value">{formData.personalEmail || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Mobile Number</span><span className="preview-value">{formData.mobileNumber || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Emergency Contact</span><span className="preview-value">{formData.emergencyContactName || '-'} {formData.emergencyContactNumber ? `(${formData.emergencyContactNumber})` : ''}</span></div>
                  <div className="preview-item"><span className="preview-label">Position</span><span className="preview-value">{formData.position || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Employment Type</span><span className="preview-value">{formData.employmentType || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Contract Type</span><span className="preview-value">{formData.contractType || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Date Hired</span><span className="preview-value">{formData.dateHired || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Years of Service</span><span className="preview-value">{yearsOfService}</span></div>
                  <div className="preview-item"><span className="preview-label">Highest Education</span><span className="preview-value">{formData.highestEducation || '-'}</span></div>
                  <div className="preview-item"><span className="preview-label">Field of Study</span><span className="preview-value">{formData.fieldOfStudy || '-'}</span></div>
                  <div className="preview-item preview-item-full"><span className="preview-label">Certifications / Licenses</span><span className="preview-value">{formData.certifications || '-'}</span></div>
                </div>
              </div>
            )}

            <div className="add-student-actions">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={showPreview && !isEditMode ? () => setShowPreview(false) : onClose}
                  className="add-student-btn add-student-secondary"
                  disabled={submitting}
                >
                  {showPreview && !isEditMode ? 'Back to Edit' : 'Cancel'}
                </button>

                <button
                  type={showPreview && !isEditMode ? 'button' : 'submit'}
                  onClick={showPreview && !isEditMode ? submitToServer : undefined}
                  disabled={submitting}
                  className="add-student-btn add-student-primary"
                >
                  {submitting
                    ? isEditMode ? 'Saving...' : 'Adding...'
                    : isEditMode
                      ? 'Save Changes'
                      : showPreview
                        ? 'Confirm & Add Faculty'
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
