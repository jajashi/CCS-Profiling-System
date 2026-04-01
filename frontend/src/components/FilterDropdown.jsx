import React from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  onClear,
  placeholder = 'All',
  disabled = false,
}) => {
  const hasValue = value !== '' && value !== null && value !== undefined;

  return (
    <div className="filter-dropdown">
      <label className="filter-label">{label}</label>
      <div className="filter-select-wrapper">
        <select
          className="filter-select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FiChevronDown className="filter-chevron" />
      </div>
      {hasValue && (
        <button
          type="button"
          className="filter-clear-btn"
          onClick={onClear}
          title={`Clear ${label} filter`}
          aria-label={`Clear ${label} filter`}
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

export default FilterDropdown;
