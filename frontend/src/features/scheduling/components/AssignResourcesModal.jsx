import React, { useState } from 'react';
import { FiX, FiPlus, FiTrash2, FiInfo } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import { toast } from 'react-hot-toast';

export default function AssignResourcesModal({
  section,
  onClose,
  onUpdated,
  rooms,
  faculty,
  curricula,
  timeBlocks,
}) {
  const [schedules, setSchedules] = useState(section.schedules || []);
  const [submitting, setSubmitting] = useState(false);

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        curriculumId: "",
        roomId: "",
        facultyId: "",
        dayOfWeek: "Mon",
        startTime: "09:00",
        endTime: "10:30",
      },
    ]);
  };

  const removeSchedule = (index) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index, field, value) => {
    const next = [...schedules];
    next[index] = { ...next[index], [field]: value };

    // If selecting a time block, auto-fill times
    if (field === "timeBlockId" && value) {
      const tb = timeBlocks.find((t) => t._id === value);
      if (tb) {
        next[index].startTime = tb.startTime;
        next[index].endTime = tb.endTime;
        if (tb.daysOfWeek && tb.daysOfWeek.length > 0) {
          next[index].dayOfWeek = tb.daysOfWeek[0];
        }
      }
    }

    setSchedules(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(
        `/api/scheduling/sections/${section._id}/resources`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedules }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Conflict detected");

      toast.success("Schedule published successfully.");
      onUpdated(data);
    } catch (err) {
      toast.error(err.message, { duration: 5000 });
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
              Resource Assignment: {section.sectionIdentifier}
            </h2>
            <p className="spec-modal-sub">
              Assign faculty, rooms, and time slots. Conflict prevention is
              active.
            </p>
          </div>
          <button onClick={onClose} className="spec-modal-close">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="spec-modal-body">
          {section.currentEnrollmentCount === 0 && (
            <div className="spec-alert spec-alert--warning" style={{ marginBottom: "1.5rem" }}>
              <FiInfo /> <strong>Notice:</strong> Please populate this section with students before assigning faculty and rooms.
            </div>
          )}

          {schedules.length === 0 && (
            <div className="spec-empty-state" style={{ padding: "2rem" }}>
              <p>No subjects scheduled yet.</p>
            </div>
          )}

          {schedules.map((sched, index) => (
            <div key={index} className="resource-form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr 1.2fr auto" }}>
              <div className="form-field">
                <label className="form-label">Subject / Course</label>
                <select
                  className="form-select"
                  value={sched.curriculumId?._id || sched.curriculumId}
                  onChange={(e) =>
                    updateSchedule(index, "curriculumId", e.target.value)
                  }
                  disabled={section.currentEnrollmentCount === 0}
                  required>
                  <option value="">Select Subject...</option>
                  {curricula
                    .filter(c => c.program === section.program)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.courseCode} - {c.courseTitle}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Room</label>
                <select
                  className="form-select"
                  value={sched.roomId?._id || sched.roomId}
                  onChange={(e) =>
                    updateSchedule(index, "roomId", e.target.value)
                  }
                  disabled={section.currentEnrollmentCount === 0}
                  required>
                  <option value="">Select Room...</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.roomCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Faculty</label>
                <select
                  className="form-select"
                  value={sched.facultyId?._id || sched.facultyId}
                  onChange={(e) =>
                    updateSchedule(index, "facultyId", e.target.value)
                  }
                  disabled={section.currentEnrollmentCount === 0}
                  required>
                  <option value="">Select Instructor...</option>
                  {faculty.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.firstName} {f.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Day & Time</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    className="form-select"
                    value={sched.dayOfWeek}
                    onChange={(e) =>
                      updateSchedule(index, "dayOfWeek", e.target.value)
                    }
                    disabled={section.currentEnrollmentCount === 0}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ),
                    )}
                  </select>
                  <input
                    type="time"
                    className="form-input"
                    value={sched.startTime}
                    onChange={(e) =>
                      updateSchedule(index, "startTime", e.target.value)
                    }
                    disabled={section.currentEnrollmentCount === 0}
                  />
                  <input
                    type="time"
                    className="form-input"
                    value={sched.endTime}
                    onChange={(e) =>
                      updateSchedule(index, "endTime", e.target.value)
                    }
                    disabled={section.currentEnrollmentCount === 0}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-remove-sched"
                onClick={() => removeSchedule(index)}>
                <FiTrash2 />
              </button>
            </div>
          ))}

          <button 
            type="button" 
            className="add-sched-btn" 
            onClick={addSchedule}
            disabled={section.currentEnrollmentCount === 0}
          >
            <FiPlus /> Add Subject Schedule
          </button>

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
              disabled={submitting || section.currentEnrollmentCount === 0}>
              {submitting ? "Validating & Saving..." : "Publish Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
