import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiX, FiCheck } from "react-icons/fi";

const MultiSelectFilter = ({
  label,
  value,
  options,
  onChange,
  onClear,
  placeholder = "All",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedValues = value || [];
  const hasValue = selectedValues.length > 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optionValue) => {
    const newValue = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValue);
  };

  const handleRemoveTag = (optionValue) => {
    const newValue = selectedValues.filter((v) => v !== optionValue);
    onChange(newValue);
  };

  const getSelectedLabels = () => {
    return selectedValues
      .map((val) => {
        const option = options.find((opt) => opt.value === val);
        return option ? option.label : val;
      })
      .join(", ");
  };

  return (
    <div className="filter-dropdown multi-select-dropdown" ref={dropdownRef}>
      <label className="filter-label">{label}</label>
      <div className="multi-select-wrapper">
        <div
          className={`multi-select-trigger ${isOpen ? "open" : ""}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          role="button"
          aria-expanded={isOpen}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}>
          {hasValue ? (
            <div className="multi-select-tags">
              {selectedValues.map((val) => {
                const option = options.find((opt) => opt.value === val);
                const label = option ? option.label : val;
                return (
                  <span key={val} className="multi-select-tag">
                    {label}
                    <button
                      type="button"
                      className="multi-select-tag-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(val);
                      }}
                      aria-label={`Remove ${label}`}>
                      <FiX />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="multi-select-placeholder">{placeholder}</span>
          )}
          <FiChevronDown className="filter-chevron" />
        </div>
        {isOpen && !disabled && (
          <div className="multi-select-dropdown-menu">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`multi-select-option ${isSelected ? "selected" : ""}`}
                  onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(option.value)}
                    className="multi-select-checkbox"
                  />
                  <span className="multi-select-checkbox-custom">
                    {isSelected && <FiCheck />}
                  </span>
                  <span className="multi-select-option-label">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {hasValue && !isOpen && (
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

export default MultiSelectFilter;
