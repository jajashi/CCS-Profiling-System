import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import './CurriculumYearPicker.css';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function getGridYears(center, minYear, maxYear) {
  const span = maxYear - minYear + 1;
  if (span <= 9) {
    const years = [];
    for (let y = minYear; y <= maxYear; y += 1) years.push(y);
    return years;
  }
  const c = clamp(center, minYear + 4, maxYear - 4);
  const years = [];
  for (let i = -4; i <= 4; i += 1) years.push(c + i);
  return years;
}

export default function CurriculumYearPicker({ id, value, onChange, disabled = false, minYear, maxYear, todayYear, error = false }) {
  const wrapRef = useRef(null);
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 260 });

  const selected = parseInt(String(value ?? ''), 10);
  const hasValidSelection = Number.isFinite(selected) && selected >= minYear && selected <= maxYear;

  const narrowRange = maxYear - minYear + 1 <= 9;

  const initialCenter = useMemo(() => {
    if (hasValidSelection) return selected;
    if (narrowRange) return Math.round((minYear + maxYear) / 2);
    const low = minYear + 4;
    const high = maxYear - 4;
    if (high < low) return Math.round((minYear + maxYear) / 2);
    return clamp(todayYear, low, high);
  }, [hasValidSelection, selected, todayYear, minYear, maxYear, narrowRange]);

  const [viewCenter, setViewCenter] = useState(initialCenter);

  useEffect(() => {
    if (!open) return;
    if (hasValidSelection) {
      setViewCenter(selected);
      return;
    }
    if (narrowRange) {
      setViewCenter(Math.round((minYear + maxYear) / 2));
      return;
    }
    const low = minYear + 4;
    const high = maxYear - 4;
    if (high < low) setViewCenter(Math.round((minYear + maxYear) / 2));
    else setViewCenter(clamp(todayYear, low, high));
  }, [open, hasValidSelection, selected, todayYear, minYear, maxYear, narrowRange]);

  const updatePopoverPosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, 260);
    let left = r.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    setPopoverPos({ top: r.bottom + 6, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePopoverPosition();
    window.addEventListener('scroll', updatePopoverPosition, true);
    window.addEventListener('resize', updatePopoverPosition);
    return () => {
      window.removeEventListener('scroll', updatePopoverPosition, true);
      window.removeEventListener('resize', updatePopoverPosition);
    };
  }, [open, updatePopoverPosition]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      const t = e.target;
      if (wrapRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const gridYears = useMemo(
    () => getGridYears(viewCenter, minYear, maxYear),
    [viewCenter, minYear, maxYear],
  );

  const canShiftPageBack = !narrowRange && viewCenter > minYear + 4;
  const canShiftPageFwd = !narrowRange && viewCenter < maxYear - 4;
  const canShiftDecadeBack = !narrowRange && viewCenter > minYear + 4;
  const canShiftDecadeFwd = !narrowRange && viewCenter < maxYear - 4;

  const shiftCenter = useCallback(
    (delta) => {
      if (narrowRange) return;
      setViewCenter((prev) => {
        const next = prev + delta;
        const low = minYear + 4;
        const high = maxYear - 4;
        if (high < low) return clamp(next, minYear, maxYear);
        return clamp(next, low, high);
      });
    },
    [minYear, maxYear, narrowRange],
  );

  const pickYear = (y) => {
    if (y < minYear || y > maxYear) return;
    onChange(String(y));
    setOpen(false);
  };

  const goToday = () => {
    const y = clamp(todayYear, minYear, maxYear);
    onChange(String(y));
    if (!narrowRange) {
      setViewCenter(clamp(todayYear, minYear + 4, maxYear - 4));
    }
    setOpen(false);
  };

  const triggerLabel = hasValidSelection ? String(selected) : 'Select year';

  const popover = open ? (
    <div
      ref={popoverRef}
      id={`${id}-popover`}
      className="curriculum-year-picker__popover"
      role="dialog"
      aria-label="Choose curriculum year"
      style={{
        position: 'fixed',
        top: popoverPos.top,
        left: popoverPos.left,
        width: popoverPos.width,
        zIndex: 10050,
      }}
    >
      <div className="curriculum-year-picker__header">
        <div className="curriculum-year-picker__nav">
          <button
            type="button"
            className="curriculum-year-picker__nav-btn"
            onClick={() => shiftCenter(-10)}
            disabled={disabled || !canShiftDecadeBack}
            aria-label="Previous decade"
            title="Previous decade"
          >
            <FiChevronsLeft size={16} />
          </button>
          <button
            type="button"
            className="curriculum-year-picker__nav-btn"
            onClick={() => shiftCenter(-9)}
            disabled={disabled || !canShiftPageBack}
            aria-label="Previous years"
            title="Previous page"
          >
            <FiChevronLeft size={16} />
          </button>
        </div>
        <span id={`${id}-focus`} className="curriculum-year-picker__focus-year" aria-live="polite">
          {viewCenter}
        </span>
        <div className="curriculum-year-picker__nav">
          <button
            type="button"
            className="curriculum-year-picker__nav-btn"
            onClick={() => shiftCenter(9)}
            disabled={disabled || !canShiftPageFwd}
            aria-label="Next years"
            title="Next page"
          >
            <FiChevronRight size={16} />
          </button>
          <button
            type="button"
            className="curriculum-year-picker__nav-btn"
            onClick={() => shiftCenter(10)}
            disabled={disabled || !canShiftDecadeFwd}
            aria-label="Next decade"
            title="Next decade"
          >
            <FiChevronsRight size={16} />
          </button>
        </div>
      </div>

      <div className="curriculum-year-picker__grid" role="listbox" aria-labelledby={`${id}-focus`}>
        {gridYears.map((y) => {
          const isSelected = hasValidSelection && y === selected;
          const outOfRange = y < minYear || y > maxYear;
          return (
            <button
              key={y}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={`curriculum-year-picker__cell ${isSelected ? 'curriculum-year-picker__cell--selected' : ''}`}
              onClick={() => !outOfRange && pickYear(y)}
              disabled={disabled || outOfRange}
            >
              {y}
            </button>
          );
        })}
      </div>

      <div className="curriculum-year-picker__footer">
        <button type="button" className="curriculum-year-picker__today" onClick={goToday} disabled={disabled}>
          Today
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="curriculum-year-picker" ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={`curriculum-year-picker__trigger ${error ? 'curriculum-year-picker__trigger--error' : ''}`}
        data-has-value={hasValidSelection ? 'true' : 'false'}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? `${id}-popover` : undefined}
      >
        <span className="curriculum-year-picker__trigger-text">{triggerLabel}</span>
        <FiCalendar className="curriculum-year-picker__trigger-icon" aria-hidden />
      </button>

      {popover ? createPortal(popover, document.body) : null}
    </div>
  );
}
