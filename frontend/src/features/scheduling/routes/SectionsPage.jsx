import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiCalendar,
  FiBook,
  FiUser,
  FiMapPin,
  FiGrid,
  FiSettings,
  FiX,
  FiTrash2,
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiArrowRight,
  FiCheckSquare,
  FiSquare,
  FiAlertTriangle,
} from "react-icons/fi";
import { apiFetch } from "../../../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "../../../providers/AuthContext";
import AddEditSyllabusModal from "../../instruction/components/AddEditSyllabusModal";
import AssignResourcesModal from "../components/AssignResourcesModal";
import "../../students/routes/StudentInformation.css";
import "./SectionsPage.css";

// --- Modals ---

function CreateSectionModal({ onClose, onCreated, curricula }) {
  const [form, setForm] = useState({
    sectionIdentifier: "",
    program: "IT",
    yearLevel: "1st Year",
    term: "1st Term",
    academicYear: "2025-2026",
    curriculumId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sectionIdentifier)
      return toast.error("Section name is required.");

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/scheduling/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create section");

      toast.success("Block section created successfully.");
      onCreated(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div className="spec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">Create New Block Section</h2>
            <p className="spec-modal-sub">
              Define a new cohort group for academic organization.
            </p>
          </div>
          <button onClick={onClose} className="spec-modal-close">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="spec-modal-body">
          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">Section Name</label>
              <input
                className="form-input"
                value={form.sectionIdentifier}
                onChange={(e) =>
                  setForm({ ...form, sectionIdentifier: e.target.value })
                }
                placeholder="e.g. BSIT-1A"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Program</label>
              <select
                className="form-select"
                value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
                required>
                <option value="IT">BSIT</option>
                <option value="CS">BSCS</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">Year Level</label>
              <select
                className="form-select"
                value={form.yearLevel}
                onChange={(e) =>
                  setForm({ ...form, yearLevel: e.target.value })
                }
                required>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Capacity (Hard Limit)</label>
              <input className="form-input" value="55" disabled readOnly />
            </div>
          </div>

          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">Academic Year</label>
              <input
                className="form-input"
                value={form.academicYear}
                onChange={(e) =>
                  setForm({ ...form, academicYear: e.target.value })
                }
                placeholder="e.g. 2025-2026"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Term / Semester</label>
              <select
                className="form-select"
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}>
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Primary Curriculum (Optional)</label>
            <select
              className="form-select"
              value={form.curriculumId}
              onChange={(e) =>
                setForm({ ...form, curriculumId: e.target.value })
              }>
              <option value="">None / To be assigned...</option>
              {curricula &&
                curricula.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.courseCode} - {c.courseTitle}
                  </option>
                ))}
            </select>
          </div>

          <div className="spec-modal-footer">
            <button
              type="button"
              className="spec-btn-secondary"
              onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="spec-btn-primary"
              disabled={submitting}>
              {submitting ? "Creating..." : "Create Block Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditSectionModal({ section, onClose, onUpdated }) {
  const [form, setForm] = useState({
    sectionIdentifier: section.sectionIdentifier || "",
    program: section.program || "IT",
    yearLevel: section.yearLevel || "1st Year",
    term: section.term || "1st Term",
    academicYear: section.academicYear || "2025-2026",
    status: section.status || "Active",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/scheduling/sections/${section._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update section");

      toast.success("Section details updated.");
      onUpdated(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div className="spec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">Edit Section Details</h2>
            <p className="spec-modal-sub">
              Modify basic information for {section.sectionIdentifier}.
            </p>
          </div>
          <button onClick={onClose} className="spec-modal-close">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="spec-modal-body">
          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">Section Name</label>
              <input
                className="form-input"
                value={form.sectionIdentifier}
                onChange={(e) =>
                  setForm({ ...form, sectionIdentifier: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">Program</label>
              <select
                className="form-select"
                value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
                required>
                <option value="IT">BSIT</option>
                <option value="CS">BSCS</option>
                <option value="General">General</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Year Level</label>
              <select
                className="form-select"
                value={form.yearLevel}
                onChange={(e) =>
                  setForm({ ...form, yearLevel: e.target.value })
                }
                required>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">Academic Year</label>
              <input
                className="form-input"
                value={form.academicYear}
                onChange={(e) =>
                  setForm({ ...form, academicYear: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Term</label>
              <select
                className="form-select"
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}>
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          <div className="spec-modal-footer">
            <button
              type="button"
              className="spec-btn-secondary"
              onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="spec-btn-primary"
              disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MassEnrollModal({ section, onClose, onUpdated }) {
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    async function loadAvailable() {
      try {
        setLoading(true);
        // Fetch students not already in this section
        const params = new URLSearchParams({
          limit: "100",
          status: "Enrolled",
        });
        if (programFilter !== "All") params.append("program", programFilter);
        if (yearFilter !== "All") params.append("yearLevel", yearFilter);
        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);

        const res = await apiFetch(`/api/students?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          // Filter out students already in this section
          const filtered = (data.students || []).filter(
            (s) => s.sectionId !== section._id,
          );
          setAvailableStudents(filtered);
        }
      } catch {
        toast.error("Failed to load students.");
      } finally {
        setLoading(false);
      }
    }
    loadAvailable();
  }, [programFilter, yearFilter, debouncedSearchTerm, section._id]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (selectedIds.size === 0) return;

    const newTotal = section.currentEnrollmentCount + selectedIds.size;
    if (newTotal > 55) {
      return toast.error(
        "Cannot enroll: Capacity limit (55) would be exceeded.",
      );
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(
        `/api/scheduling/sections/${section._id}/roster`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ add: Array.from(selectedIds) }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to enroll students.");

      toast.success(`${selectedIds.size} students enrolled successfully.`);
      onUpdated(data.section);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentCapacity = section.currentEnrollmentCount || 0;
  const remaining = 55 - currentCapacity;

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div
        className="spec-modal spec-modal--wide"
        onClick={(e) => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">
              Mass Enrollment: {section.sectionIdentifier}
            </h2>
            <p className="spec-modal-sub">
              Select multiple students to add to this cohort.
            </p>
          </div>
          <button onClick={onClose} className="spec-modal-close">
            <FiX />
          </button>
        </div>
        <div className="spec-modal-body">
          <div className="capacity-warning">
            <FiInfo /> Currently <strong>{currentCapacity}/55</strong> enrolled.
            {remaining <= 5 && (
              <span
                style={{
                  color: "#ef4444",
                  fontWeight: 700,
                  marginLeft: "0.5rem",
                }}>
                Warning: Approaching capacity!
              </span>
            )}
          </div>

          <div className="section-filters-row enrollment-search-box">
            <input
              className="form-input"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="form-select"
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}>
              <option value="All">All Programs</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
            </select>
            <select
              className="form-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}>
              <option value="All">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {loading ? (
            <div className="spec-loading">Searching students...</div>
          ) : (
            <div className="student-selection-list">
              {availableStudents.length === 0 ? (
                <p style={{ padding: "1rem", textAlign: "center" }}>
                  No available students found.
                </p>
              ) : (
                availableStudents.map((s) => (
                  <div
                    key={s._id}
                    className={`student-select-item ${selectedIds.has(s._id) ? "selected" : ""}`}
                    onClick={() => toggleSelect(s._id)}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s._id)}
                      readOnly
                    />
                    <div className="student-info-brief">
                      <span className="student-name-id">
                        {s.lastName}, {s.firstName} ({s.id})
                      </span>
                      <span className="student-prog-year">
                        {s.program} - {s.yearLevel}{" "}
                        {s.section ? `[Currently in ${s.section}]` : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="spec-modal-footer">
          <span style={{ flex: 1, fontSize: "0.875rem", color: "#64748b" }}>
            {selectedIds.size} students selected
          </span>
          <button className="spec-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="spec-btn-primary"
            onClick={handleEnroll}
            disabled={
              submitting ||
              selectedIds.size === 0 ||
              currentCapacity + selectedIds.size > 55
            }>
            {submitting
              ? "Enrolling..."
              : `Enroll ${selectedIds.size} Students`}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferStudentModal({ student, fromSection, onClose, onUpdated }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSections() {
      try {
        const res = await apiFetch("/api/scheduling/sections?status=Active");
        const data = await res.json();
        if (res.ok) {
          // Filter out current section and full sections
          setSections(data.filter((s) => s._id !== fromSection._id));
        }
      } catch {
        toast.error("Failed to load available sections.");
      } finally {
        setLoading(false);
      }
    }
    loadSections();
  }, [fromSection._id]);

  const handleTransfer = async () => {
    if (!targetId) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/scheduling/sections/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student._id,
          targetSectionId: targetId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Transfer failed.");
      }
      toast.success(`Transferred ${student.firstName} successfully.`);
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div className="spec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">Transfer Student</h2>
            <p className="spec-modal-sub">
              Move {student.firstName} {student.lastName} to another section.
            </p>
          </div>
          <button onClick={onClose} className="spec-modal-close">
            <FiX />
          </button>
        </div>
        <div className="spec-modal-body">
          <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
            Current Section: <strong>{fromSection.sectionIdentifier}</strong>
          </p>
          <label className="form-label">Select Target Section</label>
          {loading ? (
            <div className="spec-loading">Loading sections...</div>
          ) : (
            <div className="transfer-target-list">
              {sections.map((s) => (
                <div
                  key={s._id}
                  className={`target-section-card ${targetId === s._id ? "selected" : ""} ${s.currentEnrollmentCount >= 55 ? "disabled" : ""}`}
                  onClick={() =>
                    s.currentEnrollmentCount < 55 && setTargetId(s._id)
                  }>
                  <span className="target-section-info">
                    {s.sectionIdentifier}
                  </span>
                  <span className="target-section-cap">
                    Capacity: {s.currentEnrollmentCount}/55
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="spec-modal-footer">
          <button className="spec-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="spec-btn-primary"
            onClick={handleTransfer}
            disabled={submitting || !targetId}>
            {submitting ? "Transferring..." : "Complete Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
function ManageRosterModal({ section, onClose, onUpdated }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRemovals, setSelectedRemovals] = useState(new Set());
  const [removalReason, setRemovalReason] = useState("");
  const [showMassEnroll, setShowMassEnroll] = useState(false);
  const [transferStudent, setTransferStudent] = useState(null);
  const [error, setError] = useState("");

  const loadRoster = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(
        `/api/scheduling/sections/${encodeURIComponent(section._id)}/roster`,
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to load section roster.");
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (err) {
      console.error("[ManageRosterModal] loadRoster", err);
      setError(err.message || "Unable to load roster.");
    } finally {
      setLoading(false);
    }
  }, [section._id]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const toggleRemoval = (studentId) => {
    setSelectedRemovals((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (selectedRemovals.size === 0) {
      setError("Select at least one student to remove.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to remove ${selectedRemovals.size} student(s) from this section?`,
      )
    ) {
      return;
    }

    const remove = Array.from(selectedRemovals);

    setSubmitting(true);
    try {
      const res = await apiFetch(
        `/api/scheduling/sections/${encodeURIComponent(section._id)}/roster`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remove, removalReason }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update roster.");

      if (data.section) onUpdated?.(data.section);
      if (Array.isArray(data.students)) setStudents(data.students);
      setSelectedRemovals(new Set());
      setRemovalReason("");
      toast.success("Roster updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update roster.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div
        className="spec-modal spec-modal--wide"
        onClick={(e) => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">
              Manage Roster: {section.sectionIdentifier}
            </h2>
            <p className="spec-modal-sub">
              Modify student enrollment for this cohort.
            </p>
          </div>
          <button onClick={onClose} className="spec-modal-close">
            <FiX />
          </button>
        </div>
        <div className="spec-modal-body">
          {error && <div className="spec-alert spec-alert--error">{error}</div>}

          <div className="roster-actions-top">
            <button
              type="button"
              className="spec-btn-primary"
              onClick={() => setShowMassEnroll(true)}>
              <FiPlus /> Mass Enroll Students
            </button>
          </div>

          <div className="form-field">
            <label className="form-label">
              Currently Enrolled (Capacity: {section.currentEnrollmentCount}/55)
            </label>
            {loading ? (
              <div className="spec-loading">Loading roster...</div>
            ) : students.length === 0 ? (
              <div className="spec-empty-inline">No students enrolled.</div>
            ) : (
              <div className="roster-table-wrapper">
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>
                        <FiCheckSquare style={{ color: "#94a3b8" }} />
                      </th>
                      <th>Student Details</th>
                      <th>Program & Year</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
                      return (
                        <tr key={student._id}>
                          <td>
                            <input
                              type="checkbox"
                              className="roster-checkbox"
                              checked={selectedRemovals.has(student._id)}
                              onChange={() => toggleRemoval(student._id)}
                            />
                          </td>
                          <td>
                            <div className="roster-student-cell">
                              <div className="roster-avatar">{initials}</div>
                              <div className="roster-student-info">
                                <span className="roster-student-name">
                                  {student.lastName}, {student.firstName}
                                </span>
                                <span className="roster-student-id">{student.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              <span className="roster-badge">{student.program}</span>
                              <span className="text-xs text-slate-500 font-medium">{student.yearLevel}</span>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="action-btn view"
                              style={{ width: "auto", padding: "0 0.75rem", height: "32px", fontSize: "0.8rem", gap: "0.4rem" }}
                              onClick={() => setTransferStudent(student)}>
                              <FiArrowRight />
                              <span>Transfer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {selectedRemovals.size > 0 && (
            <div className="form-field" style={{ marginTop: "1rem" }}>
              <label className="form-label">
                Removal Reason (Required for removals)
              </label>
              <input
                className="form-input"
                placeholder="e.g. Withdrawal, Section Adjustment..."
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                required
              />
            </div>
          )}
        </div>
        <div className="spec-modal-footer">
          <button
            type="button"
            className="spec-btn-secondary"
            onClick={onClose}>
            Close
          </button>
          {selectedRemovals.size > 0 && (
            <button
              type="button"
              className="spec-btn-danger"
              onClick={handleSubmit}
              disabled={submitting || !removalReason}>
              {submitting
                ? "Removing..."
                : `Remove ${selectedRemovals.size} Selected`}
            </button>
          )}
        </div>
      </div>

      {showMassEnroll && (
        <MassEnrollModal
          section={section}
          onClose={() => setShowMassEnroll(false)}
          onUpdated={(updatedSection) => {
            onUpdated(updatedSection);
            loadRoster();
          }}
        />
      )}

      {transferStudent && (
        <TransferStudentModal
          student={transferStudent}
          fromSection={section}
          onClose={() => setTransferStudent(null)}
          onUpdated={() => {
            onUpdated();
            loadRoster();
          }}
        />
      )}
    </div>
  );
}

export default function SectionsPage() {
  const PAGE_SIZE = 12;
  const { isAdmin } = useAuth();
  const [sections, setSections] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [rosterTarget, setRosterTarget] = useState(null);
  const [syllabusSectionId, setSyllabusSectionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("All");
  const [yearLevelFilter, setYearLevelFilter] = useState("All");
  const [termFilter, setTermFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, curRes, roomRes, facRes, tbRes] = await Promise.all([
        apiFetch("/api/scheduling/sections?status=All"),
        apiFetch("/api/curricula?status=Active"),
        apiFetch("/api/scheduling/rooms?status=Active"),
        apiFetch("/api/faculty?status=Active"),
        apiFetch("/api/scheduling/timeblocks"),
      ]);

      setSections(await secRes.json());
      setCurricula(await curRes.json());
      setRooms(await roomRes.json());
      setFaculty(await facRes.json());
      setTimeBlocks(await tbRes.json());
    } catch {
      toast.error("Failed to load scheduling data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const termOptions = useMemo(
    () => [
      "All",
      ...new Set(
        sections.map((s) => String(s.term || "").trim()).filter(Boolean),
      ),
    ],
    [sections],
  );
  const yearOptions = useMemo(
    () => [
      "All",
      ...new Set(
        sections
          .map((s) => String(s.academicYear || "").trim())
          .filter(Boolean),
      ),
    ],
    [sections],
  );
  const statusOptions = useMemo(
    () => [
      "All",
      ...new Set(
        sections.map((s) => String(s.status || "").trim()).filter(Boolean),
      ),
    ],
    [sections],
  );

  const filteredSections = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return sections.filter((s) => {
      const matchesSearch =
        !q ||
        s.sectionIdentifier.toLowerCase().includes(q) ||
        s.curriculumId?.courseTitle?.toLowerCase().includes(q) ||
        s.curriculumId?.courseCode?.toLowerCase().includes(q);
      const matchesProgram =
        programFilter === "All" || s.program === programFilter;
      const matchesYearLevel =
        yearLevelFilter === "All" || s.yearLevel === yearLevelFilter;
      const matchesTerm =
        termFilter === "All" || String(s.term || "") === termFilter;
      const matchesYear =
        yearFilter === "All" || String(s.academicYear || "") === yearFilter;
      const matchesStatus =
        statusFilter === "All" || String(s.status || "") === statusFilter;
      return (
        matchesSearch &&
        matchesProgram &&
        matchesYearLevel &&
        matchesTerm &&
        matchesYear &&
        matchesStatus
      );
    });
  }, [
    sections,
    searchTerm,
    programFilter,
    yearLevelFilter,
    termFilter,
    yearFilter,
    statusFilter,
  ]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paginatedSections.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSections.map((s) => s._id)));
    }
  };

  const handleDeleteSection = async (id, identifier) => {
    if (!window.confirm(`Are you sure you want to delete section ${identifier}? This will remove all student assignments and schedules.`)) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/scheduling/sections/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete section.");
      }
      toast.success("Section deleted successfully.");
      setSections(sections.filter(s => s._id !== id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingId("");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} sections? This action is permanent.`)) return;

    try {
      const res = await apiFetch("/api/scheduling/sections/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bulk delete failed.");

      toast.success(data.message || "Sections deleted successfully.");
      setSections(sections.filter((s) => !selectedIds.has(s._id)));
      setSelectedIds(new Set());
      setIsBulkMode(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const totalPages = Math.max(
    Math.ceil(filteredSections.length / PAGE_SIZE),
    1,
  );
  const paginatedSections = filteredSections.slice(
    (page - 1) * PAGE_SIZE,
    (page - 1) * PAGE_SIZE + PAGE_SIZE,
  );
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, termFilter, yearFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPageInput(String(page || 1));
  }, [page]);

  const handlePageJump = () => {
    const parsed = Number.parseInt(String(pageInput || "").trim(), 10);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(page || 1));
      return;
    }
    const nextPage = Math.min(
      Math.max(parsed, 1),
      Math.max(totalPages || 1, 1),
    );
    setPageInput(String(nextPage));
    if (nextPage !== page) {
      setPage(nextPage);
    }
  };

  return (
    <div className="sections-page spec-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiGrid />
        </div>
        <div>
          <p className="directory-hero-title">Section Management</p>
          <p className="directory-hero-subtitle">
            Initialize class sections and assign logistical resources (Rooms,
            Faculty, Times).
          </p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar">
          <div className="section-toolbar-filters">
            <div className="search-box curriculum-search">
              <FiSearch />
              <input
                placeholder="Search sections, courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="filter-select curriculum-select"
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}>
              <option value="All">All Programs</option>
              <option value="IT">BSIT</option>
              <option value="CS">BSCS</option>
              <option value="General">General</option>
            </select>
            <select
              className="filter-select curriculum-select"
              value={yearLevelFilter}
              onChange={(e) => setYearLevelFilter(e.target.value)}>
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <select
              className="filter-select curriculum-select"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}>
              {termOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Terms" : option}
                </option>
              ))}
            </select>
            <select
              className="filter-select curriculum-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}>
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Academic Years" : option}
                </option>
              ))}
            </select>
            <select
              className="filter-select curriculum-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Statuses" : option}
                </option>
              ))}
            </select>
          </div>
          <div className="section-toolbar-right" style={{ display: "flex", gap: "0.75rem" }}>
            {isAdmin && (
              <>
                <button
                  className={`spec-btn-secondary ${isBulkMode ? "active" : ""}`}
                  onClick={() => {
                    setIsBulkMode(!isBulkMode);
                    setSelectedIds(new Set());
                  }}>
                  <FiCheckSquare /> {isBulkMode ? "Cancel Bulk" : "Bulk Delete"}
                </button>
                {isBulkMode && selectedIds.size > 0 && (
                  <button className="spec-btn-danger" onClick={handleBulkDelete}>
                    <FiTrash2 /> Delete Selected ({selectedIds.size})
                  </button>
                )}
              </>
            )}
            <button
              className="spec-btn-primary"
              onClick={() => setShowCreate(true)}>
              <FiPlus /> New Section
            </button>
          </div>
        </div>
        {!loading ? (
          <div className="results-count">
            <div className="results-count-text">
              Showing <strong>{filteredSections.length}</strong> section
              {filteredSections.length === 1 ? "" : "s"}
            </div>
            {filteredSections.length > PAGE_SIZE ? (
              <div
                className="results-count-pagination"
                aria-label="Top pagination controls">
                <button
                  className="pagination-btn pagination-btn-sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!hasPrev}
                  type="button"
                  aria-label="Previous page">
                  <FiChevronLeft />
                </button>
                <label
                  className="pagination-input-wrap"
                  aria-label="Page number">
                  <span className="pagination-input-label">Page</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    inputMode="numeric"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageJump}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handlePageJump();
                      }
                    }}
                    className="pagination-page-input"
                  />
                </label>
                <span className="pagination-info pagination-info-sm">
                  of {totalPages}
                </span>
                <button
                  className="pagination-btn pagination-btn-sm"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={!hasNext}
                  type="button"
                  aria-label="Next page">
                  <FiChevronRight />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="spec-loading">Loading sections architecture...</div>
      ) : (
        <div className="section-grid">
          {paginatedSections.map((section) => (
            <div key={section._id} className="section-card">
              <div className="section-header">
                <span className="section-id">{section.sectionIdentifier}</span>
                <span
                  className={`section-status status-${section.status.toLowerCase()}`}>
                  {section.status}
                </span>
              </div>

              <h3 className="section-course-title">
                {section.program} - {section.yearLevel}
              </h3>

              <div className="capacity-progress-container">
                <div className="capacity-progress-bar-bg">
                  <div
                    className={`capacity-progress-bar-fill ${
                      section.currentEnrollmentCount <= 45
                        ? "safe"
                        : section.currentEnrollmentCount < 55
                          ? "warning"
                          : "danger"
                    }`}
                    style={{
                      width: `${Math.min((section.currentEnrollmentCount / 55) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="capacity-label">
                  <span>Capacity</span>
                  <span>
                    <strong>{section.currentEnrollmentCount}</strong> / 55
                  </span>
                </div>
              </div>

              <div className="section-meta-row" style={{ marginTop: "0.5rem" }}>
                <div className="meta-item badge-subjects">
                  <FiBook size={12} />{" "}
                  <strong>{(section.schedules || []).length}</strong> Subjects
                </div>
              </div>

              <div className="section-meta-row">
                <div className="meta-item">
                  <FiCalendar size={14} /> {section.term}
                </div>
                <div className="meta-item">
                  <FiGrid size={14} /> {section.academicYear}
                </div>
              </div>

              <div className="section-schedules">
                <p
                  className="form-label"
                  style={{ fontSize: "0.7rem", marginBottom: "0.5rem" }}>
                  ACTIVE SCHEDULES
                </p>
                <ul className="schedule-list">
                  {section.schedules && section.schedules.length > 0 ? (
                    section.schedules.map((s, i) => (
                      <li key={i} className="schedule-item">
                        <div className="schedule-course-tag">
                          {s.curriculumId?.courseCode || "N/A"}
                        </div>
                        <span className="schedule-time">
                          {s.dayOfWeek} {s.startTime}-{s.endTime}
                        </span>
                        <div className="schedule-resource">
                          <FiMapPin size={12} />{" "}
                          {s.roomId?.name || "Unknown Room"}
                        </div>
                        <div className="schedule-resource">
                          <FiUser size={12} />{" "}
                          {s.facultyId
                            ? `${s.facultyId.firstName} ${s.facultyId.lastName}`
                            : "Unassigned"}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="spec-empty-inline">
                      No resources assigned yet.
                    </li>
                  )}
                </ul>
              </div>

              <div className="section-students-preview">
                <h4>
                  <FiUser size={14} /> Enrolled Students (
                  {section.currentEnrollmentCount || 0})
                </h4>
                {section.enrolledStudentIds &&
                section.enrolledStudentIds.length > 0 ? (
                  <div className="student-list-mini">
                    {section.enrolledStudentIds.slice(0, 6).map((student, idx) => (
                      <div key={student._id || student.id || `student-${idx}`} className="student-chip">
                        <span className="student-chip-name">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="student-chip-id">({student.id})</span>
                      </div>
                    ))}
                    {section.enrolledStudentIds.length > 6 && (
                      <div className="student-chip">
                        <span className="student-chip-name">
                          +{section.enrolledStudentIds.length - 6} more
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-students-message">
                    No students enrolled yet
                  </div>
                )}
              </div>

              <div className="section-actions">
                <button
                  className="btn-assign"
                  onClick={() => setEditTarget(section)}>
                  <FiSettings /> Edit
                </button>
                <button
                  className="btn-assign"
                  onClick={() => setAssignTarget(section)}>
                  <FiClock /> Schedule
                </button>
                <button
                  className="btn-assign btn-roster-action"
                  onClick={() => setRosterTarget(section)}>
                  <FiUser /> Roster
                </button>
                {isAdmin &&
                  (section.syllabusId ? (
                    <Link
                      to={`/dashboard/instruction/syllabi/${section.syllabusId}`}
                      className="btn-assign btn-syllabus-action">
                      <FiBook /> Syllabus
                    </Link>
                  ) : (
                    <button
                      className="btn-assign btn-syllabus-action"
                      onClick={() => setSyllabusSectionId(section._id)}>
                      <FiBook /> Add Syllabus
                    </button>
                  ))}
                {isAdmin && (
                  <button
                    className="btn-assign btn-delete-action"
                    disabled={deletingId === section._id}
                    onClick={() => handleDeleteSection(section._id, section.sectionIdentifier)}>
                    <FiTrash2 /> {deletingId === section._id ? "..." : "Delete"}
                  </button>
                )}
              </div>
              {isBulkMode && (
                <div className="section-card-overlay" onClick={() => toggleSelect(section._id)}>
                  <div className={`selection-checkbox ${selectedIds.has(section._id) ? "checked" : ""}`}>
                    {selectedIds.has(section._id) ? <FiCheckSquare /> : <FiSquare />}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && filteredSections.length === 0 ? (
        <div className="spec-empty section-empty-state">
          No sections match your filters.
        </div>
      ) : null}
      {filteredSections.length > PAGE_SIZE ? (
        <div className="pagination-controls">
          <div
            className="results-count-pagination"
            aria-label="Bottom pagination controls">
            <button
              className="pagination-btn pagination-btn-sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!hasPrev}
              type="button"
              aria-label="Previous page">
              <FiChevronLeft />
            </button>
            <label className="pagination-input-wrap" aria-label="Page number">
              <span className="pagination-input-label">Page</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                inputMode="numeric"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageJump}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePageJump();
                  }
                }}
                className="pagination-page-input"
              />
            </label>
            <span className="pagination-info pagination-info-sm">
              of {totalPages}
            </span>
            <button
              className="pagination-btn pagination-btn-sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={!hasNext}
              type="button"
              aria-label="Next page">
              <FiChevronRight />
            </button>
          </div>
        </div>
      ) : null}

      {showCreate && (
        <CreateSectionModal
          curricula={curricula}
          onClose={() => setShowCreate(false)}
          onCreated={(newSec) => {
            setSections([newSec, ...sections]);
            setShowCreate(false);
          }}
        />
      )}

      {editTarget && (
        <EditSectionModal
          section={editTarget}
          curricula={curricula}
          onClose={() => setEditTarget(null)}
          onUpdated={(updated) => {
            setSections(
              sections.map((s) => (s._id === updated._id ? updated : s)),
            );
            setEditTarget(null);
          }}
        />
      )}

      {assignTarget && (
        <AssignResourcesModal
          section={assignTarget}
          rooms={rooms}
          faculty={faculty}
          curricula={curricula}
          timeBlocks={timeBlocks}
          onClose={() => setAssignTarget(null)}
          onUpdated={(updated) => {
            setSections(
              sections.map((s) => {
                const targetId = updated._id || updated.sectionId;
                if (String(s._id) === String(targetId)) {
                  return { ...s, ...updated };
                }
                return s;
              }),
            );
            setAssignTarget(null);
          }}
        />
      )}

      {rosterTarget && (
        <ManageRosterModal
          section={rosterTarget}
          onClose={() => setRosterTarget(null)}
          onUpdated={(updated) => {
            setSections(
              sections.map((s) => {
                const targetId = updated._id || updated.sectionId;
                if (String(s._id) === String(targetId)) {
                  return { ...s, ...updated };
                }
                return s;
              }),
            );
            setRosterTarget(null);
          }}
        />
      )}

      {syllabusSectionId && (
        <AddEditSyllabusModal
          isOpen={!!syllabusSectionId}
          onClose={() => setSyllabusSectionId(null)}
          initialSectionId={syllabusSectionId}
          onSuccess={() => {
            setSyllabusSectionId(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
