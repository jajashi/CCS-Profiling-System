import React, { useState, useRef, useEffect } from "react";
import { FiPlus, FiX } from "react-icons/fi";

const SkillsFilter = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedValues = value || [];

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

  const handleRemoveChip = (optionValue) => {
    const newValue = selectedValues.filter((v) => v !== optionValue);
    onChange(newValue);
  };

  const getSelectedLabel = (optionValue) => {
    const option = options.find((opt) => opt.value === optionValue);
    return option ? option.label : optionValue;
  };

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <label className="filter-label">{label}</label>
      <div
        className={`skills-chip-input ${isOpen ? "open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}>
        {selectedValues.map((val) => (
          <span key={val} className="skills-chip">
            {getSelectedLabel(val)}
            <button
              type="button"
              className="skills-chip-remove"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveChip(val);
              }}
              aria-label={`Remove ${getSelectedLabel(val)}`}>
              <FiX />
            </button>
          </span>
        ))}
        <button
          type="button"
          className="skills-chip-add"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}>
          <FiPlus />
          <span>+ add...</span>
        </button>
        {isOpen && (
          <div className="skills-dropdown-menu">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`skills-option ${isSelected ? "selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(option.value);
                  }}>
                  {option.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsFilter;
