import React, { useState, useMemo } from 'react';
import { FiX, FiCheckCircle, FiAlertTriangle, FiArrowRight, FiActivity } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function LevelUpWizardModal({ sections, onClose, onCompleted }) {
  const [step, setStep] = useState(1); // 1: Select, 2: Preview, 3: Result
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [nextAcademicYear, setNextAcademicYear] = useState("2026-2027");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  const eligibleSections = useMemo(() => {
    return sections.filter(s => s.status === "Active" || s.status === "Closed" || s.status === "Open");
  }, [sections]);

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === eligibleSections.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleSections.map(s => s._id)));
    }
  };

  const handleLevelUp = async () => {
    setSubmitting(true);
    try {
      const promoteIds = [];
      const graduateIds = [];

      selectedIds.forEach(id => {
        const s = eligibleSections.find(sec => sec._id === id);
        if (s.yearLevel === "4th Year") graduateIds.push(id);
        else promoteIds.push(id);
      });

      let summary = { success: [], failure: [] };

      if (promoteIds.length > 0) {
        const res = await apiFetch("/api/scheduling/sections/batch-levelup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionIds: promoteIds, nextAcademicYear }),
        });
        const data = await res.json();
        if (res.ok) {
          summary.success.push(...data.success);
          summary.failure.push(...data.failure);
        } else {
          throw new Error(data.message || "Failed to level up sections");
        }
      }

      if (graduateIds.length > 0) {
        const res = await apiFetch("/api/scheduling/sections/batch-graduate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionIds: graduateIds }),
        });
        const data = await res.json();
        if (res.ok) {
          summary.success.push(...data.success);
          summary.failure.push(...data.failure);
        } else {
          throw new Error(data.message || "Failed to graduate sections");
        }
      }

      setResults(summary);
      setStep(3);
      toast.success("Level-up operation completed.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div className="spec-modal spec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">Academic Year Lifecycle Wizard</h2>
            <p className="spec-modal-sub">
              Batch promote sections to the next level or graduate final year cohorts.
            </p>
          </div>
          <button onClick={onClose} className="spec-modal-close"><FiX /></button>
        </div>

        <div className="spec-modal-body">
          {step === 1 && (
            <div className="wizard-step">
              <div className="wizard-controls" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">Target Academic Year</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={nextAcademicYear} 
                    onChange={e => setNextAcademicYear(e.target.value)}
                    placeholder="e.g. 2026-2027"
                  />
                </div>
                <button className="spec-btn-secondary" onClick={selectAll}>
                  {selectedIds.size === eligibleSections.length ? "Deselect All" : "Select All Active"}
                </button>
              </div>

              <div className="wizard-table-wrapper" style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                <table className="wizard-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Select</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Section</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Current Level</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleSections.map(s => (
                      <tr key={s._id} onClick={() => toggleSelection(s._id)} style={{ cursor: "pointer", background: selectedIds.has(s._id) ? "#f0f9ff" : "transparent" }}>
                        <td style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                          <input type="checkbox" checked={selectedIds.has(s._id)} onChange={() => {}} />
                        </td>
                        <td style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0" }}><strong>{s.sectionIdentifier}</strong></td>
                        <td style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>{s.yearLevel}</td>
                        <td style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                          {s.yearLevel === "4th Year" ? 
                            <span style={{ color: "#8b5cf6", fontWeight: 600 }}>Graduate</span> : 
                            <span style={{ color: "#10b981", fontWeight: 600 }}>Level-Up</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <div className="spec-alert spec-alert--warning" style={{ marginBottom: "1.5rem" }}>
                <FiAlertTriangle /> <strong>Final Review:</strong> This will update {selectedIds.size} sections to Academic Year {nextAcademicYear}. All existing schedules for these sections will be cleared.
              </div>
              <div className="preview-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {Array.from(selectedIds).map(id => {
                  const s = eligibleSections.find(sec => sec._id === id);
                  return (
                    <div key={id} className="preview-item" style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{s.sectionIdentifier}</div>
                      <div style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                        {s.yearLevel} <FiArrowRight size={10} /> {s.yearLevel === "4th Year" ? "Graduated" : yearLevels[yearLevels.indexOf(s.yearLevel) + 1]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step" style={{ textAlign: "center", padding: "2rem" }}>
              <FiCheckCircle size={48} color="#10b981" style={{ marginBottom: "1rem" }} />
              <h3>Lifecycle Operation Complete</h3>
              <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
                Processed <strong>{results.success.length + results.failure.length}</strong> sections.
              </p>
              
              <div style={{ textAlign: "left", maxWidth: "500px", margin: "0 auto" }}>
                {results.success.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#10b981", fontSize: "0.85rem", marginBottom: "0.5rem" }}>SUCCESSFUL ({results.success.length})</div>
                    <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "0.8rem", background: "#f0fdf4", padding: "0.5rem", borderRadius: "6px" }}>
                      {results.success.map((r, i) => <div key={i}>{r.identifier} - {r.to || 'Graduated'}</div>)}
                    </div>
                  </div>
                )}
                {results.failure.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 600, color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.5rem" }}>FAILED ({results.failure.length})</div>
                    <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "0.8rem", background: "#fef2f2", padding: "0.5rem", borderRadius: "6px" }}>
                      {results.failure.map((r, i) => <div key={i}>{r.identifier || r.id}: {r.reason}</div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="spec-modal-footer">
          {step === 1 && (
            <>
              <button className="spec-btn-secondary" onClick={onClose}>Cancel</button>
              <button className="spec-btn-primary" disabled={selectedIds.size === 0} onClick={() => setStep(2)}>
                Next: Preview Changes <FiArrowRight />
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button className="spec-btn-secondary" onClick={() => setStep(1)} disabled={submitting}>Back</button>
              <button className="spec-btn-primary" onClick={handleLevelUp} disabled={submitting}>
                {submitting ? "Processing..." : "Confirm & Execute Lifecycle"}
              </button>
            </>
          )}
          {step === 3 && (
            <button className="spec-btn-primary" onClick={() => { onCompleted(); onClose(); }}>Finish</button>
          )}
        </div>
      </div>
    </div>
  );
}
