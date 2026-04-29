import React, { useState, useEffect, useMemo } from "react";
import { FiEdit2 } from "react-icons/fi";
import { apiFetch } from "../../../lib/api";
import "./MasterScheduleMatrix.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 7;
const END_HOUR = 17;
const PIXELS_PER_HOUR = 60;

const formatHour12 = (hour24) => {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00 ${period}`;
};

const formatTime12 = (hhmm) => {
  if (!hhmm || !String(hhmm).includes(":")) return hhmm || "";
  const [hRaw, mRaw] = String(hhmm).split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const extractYearLevelFromSection = (sectionIdentifier) => {
  if (!sectionIdentifier || typeof sectionIdentifier !== "string")
    return "Unknown";
  const match = sectionIdentifier.match(/-(\d+)/);
  if (match && match[1]) return `Year ${match[1]}`;
  return "Unknown";
};

export default function MasterScheduleMatrix({ term, academicYear, onEditSection, refreshToken = 0 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("DayTime"); // 'DayTime' | 'RoomTime' | 'FacultyTime'
  const [selectedFaculty, setSelectedFaculty] = useState(null); // { id, label }

  useEffect(() => {
    if (!term || !academicYear) return;

    let cancelled = false;
    async function loadMatrix() {
      try {
        setLoading(true);
        const res = await apiFetch(
          `/api/scheduling/matrix?term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(academicYear)}`,
        );
        if (!res.ok) throw new Error("API Request Failed");
        const data = await res.json();
        if (!cancelled) {
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Matrix fetch err", err);
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMatrix();
    return () => {
      cancelled = true;
    };
  }, [term, academicYear, refreshToken]);

  // Memoization constraint to optimize heavy processing of mapped grouping elements
  const matrixData = useMemo(() => {
    // Generate display hour boundaries from 07:00 to 17:00
    const hours = Array.from(
      { length: END_HOUR - START_HOUR + 1 },
      (_, i) => i + START_HOUR,
    );
    let columns = [];

    if (viewMode === "DayTime") {
      columns = DAYS.map((d) => ({ id: d, label: d }));
    } else if (viewMode === "RoomTime") {
      const roomMap = new Map();
      events.forEach((e) => {
        if (e.roomId && !roomMap.has(e.roomId)) {
          roomMap.set(e.roomId, e.roomName || "Unknown Room");
        }
      });
      columns = Array.from(roomMap.entries()).map(([id, label]) => ({
        id,
        label,
      }));
    } else if (viewMode === "FacultyTime") {
      const facMap = new Map();
      events.forEach((e) => {
        if (e.facultyId && !facMap.has(e.facultyId)) {
          facMap.set(e.facultyId, e.facultyName || "Unknown Faculty");
        }
      });
      columns = Array.from(facMap.entries()).map(([id, label]) => ({
        id,
        label,
      }));
    } else if (viewMode === "SectionTime") {
      const sectionMap = new Map();
      events.forEach((e) => {
        if (e.sectionId && !sectionMap.has(e.sectionId)) {
          sectionMap.set(e.sectionId, e.sectionIdentifier || "Unknown Section");
        }
      });
      columns = Array.from(sectionMap.entries()).map(([id, label]) => ({
        id,
        label,
      }));
    } else if (viewMode === "YearLevelTime") {
      const yearMap = new Map();
      events.forEach((e) => {
        const yearLabel = extractYearLevelFromSection(e.sectionIdentifier);
        if (!yearMap.has(yearLabel)) {
          yearMap.set(yearLabel, yearLabel);
        }
      });
      columns = Array.from(yearMap.entries()).map(([id, label]) => ({
        id,
        label,
      }));
    }

    return { hours, columns };
  }, [events, viewMode]);

  const { hours, columns } = matrixData;

  const isSameId = (left, right) => String(left || "") === String(right || "");

  const getEventStyle = (e) => {
    const parseTime = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(":").map(Number);
      return h + (m || 0) / 60;
    };
    const startHour = parseTime(e.startTime);
    const endHour = parseTime(e.endTime);
    const clampedStart = Math.max(startHour, START_HOUR);
    const clampedEnd = Math.min(endHour, END_HOUR + 1);

    return {
      top: `${(clampedStart - START_HOUR) * PIXELS_PER_HOUR}px`,
      height: `${Math.max((clampedEnd - clampedStart) * PIXELS_PER_HOUR, 20)}px`,
    };
  };

  return (
    <div className="schedule-matrix-container">
      <div className="matrix-controls">
        <label>Grouping View: </label>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
          <option value="DayTime">View by Day</option>
          <option value="RoomTime">View by Room</option>
          <option value="FacultyTime">View by Faculty</option>
          <option value="SectionTime">View by Section</option>
          <option value="YearLevelTime">View by Year Level</option>
        </select>
      </div>

      {loading ? (
        <div className="matrix-loading">Loading Matrix...</div>
      ) : viewMode === "FacultyTime" && !selectedFaculty ? (
        <div className="faculty-cards-grid">
          {columns.map((fac) => {
            const facEvents = events.filter((e) =>
              isSameId(e.facultyId, fac.id),
            );
            const uniqueCourses = new Set(facEvents.map((e) => e.courseCode))
              .size;
            return (
              <div
                key={fac.id}
                className="faculty-schedule-card"
                onClick={() => setSelectedFaculty(fac)}>
                <div className="faculty-card-icon">{fac.label.charAt(0)}</div>
                <div className="faculty-card-content">
                  <h4 className="faculty-card-name">{fac.label}</h4>
                  <div className="faculty-card-stats">
                    <span>
                      <strong>{facEvents.length}</strong> classes
                    </span>
                    <span>
                      <strong>{uniqueCourses}</strong> courses
                    </span>
                  </div>
                  <button className="view-schedule-btn">View Schedule</button>
                </div>
              </div>
            );
          })}
          {columns.length === 0 && (
            <div className="matrix-empty-state">
              No faculty assignments found for this term.
            </div>
          )}
        </div>
      ) : (
        <>
          {selectedFaculty && (
            <div className="matrix-drilldown-header">
              <button
                className="matrix-back-btn"
                onClick={() => setSelectedFaculty(null)}>
                &larr; Back to all faculty
              </button>
              <div className="drilldown-title">
                Schedule for <strong>{selectedFaculty.label}</strong>
              </div>
            </div>
          )}
          <div className="matrix-grid">
            <div className="matrix-time-col">
              <div className="matrix-header-cell">Time</div>
              {hours.map((h) => (
                <div key={h} className="matrix-time-slot">
                  {formatHour12(h)}
                </div>
              ))}
            </div>

            <div className="matrix-columns-wrapper">
              {(selectedFaculty
                ? DAYS.map((d) => ({ id: d, label: d }))
                : columns
              ).map((col) => (
                <div key={col.id} className="matrix-column">
                  <div className="matrix-header-cell">{col.label}</div>
                  <div
                    className="matrix-events-area"
                    style={{
                      "--matrix-height": `${hours.length * PIXELS_PER_HOUR}px`,
                    }}>
                    {hours.map((h) => (
                      <div key={h} className="matrix-grid-line" />
                    ))}

                    {events
                      .filter((e) => {
                        if (selectedFaculty) {
                          return (
                            isSameId(e.facultyId, selectedFaculty.id) &&
                            String(e.dayOfWeek || "").toLowerCase() ===
                              String(col.id || "").toLowerCase()
                          );
                        }
                        if (viewMode === "DayTime") {
                          return (
                            String(e.dayOfWeek || "").toLowerCase() ===
                            String(col.id || "").toLowerCase()
                          );
                        }
                        if (viewMode === "RoomTime") {
                          return isSameId(e.roomId, col.id);
                        }
                        if (viewMode === "FacultyTime") {
                          return isSameId(e.facultyId, col.id);
                        }
                        if (viewMode === "SectionTime") {
                          return isSameId(e.sectionId, col.id);
                        }
                        if (viewMode === "YearLevelTime") {
                          return (
                            extractYearLevelFromSection(e.sectionIdentifier) ===
                            col.id
                          );
                        }
                        return false;
                      })
                      .map((e, idx) => (
                        <div
                          key={idx}
                          className="matrix-event"
                          style={getEventStyle(e)}>
                          <div className="event-title">
                            {e.sectionIdentifier}
                            {onEditSection && (
                              <button 
                                className="matrix-edit-btn" 
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  onEditSection(e.sectionId);
                                }}
                                title="Edit Section Schedule"
                              >
                                <FiEdit2 size={10} />
                              </button>
                            )}
                          </div>
                          <div className="event-time">
                            {formatTime12(e.startTime)} -{" "}
                            {formatTime12(e.endTime)}
                          </div>
                          <div className="event-sub">{e.courseCode}</div>
                          {!selectedFaculty && viewMode !== "RoomTime" && (
                            <div className="event-sub">{e.roomName}</div>
                          )}
                          {!selectedFaculty && viewMode !== "FacultyTime" && (
                            <div className="event-sub">{e.facultyName}</div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
