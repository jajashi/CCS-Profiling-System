import React from "react";
import { FiChevronDown, FiX } from "react-icons/fi";

const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  onClear,
  placeholder = "All",
  disabled = false,
  customInput = false,
}) => {
  const hasValue = value !== "" && value !== null && value !== undefined;

  if (customInput) {
    return (
      <div className="filter-dropdown">
        <label className="filter-label">{label}</label>
        <div className="filter-input-wrapper">
          <input
            type="text"
            className="filter-input"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
          />
          {hasValue && (
            <button
              type="button"
              className="filter-clear-btn"
              onClick={onClear}
              title={`Clear ${label} filter`}
              aria-label={`Clear ${label} filter`}>
              <FiX />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="filter-dropdown">
      <label className="filter-label">{label}</label>
      <div className="filter-select-wrapper">
        <select
          className="filter-select"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FiChevronDown className="filter-chevron" />
        {hasValue && (
          <button
            type="button"
            className="filter-clear-btn"
            onClick={onClear}
            title={`Clear ${label} filter`}
            aria-label={`Clear ${label} filter`}>
            <FiX />
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterDropdown;
