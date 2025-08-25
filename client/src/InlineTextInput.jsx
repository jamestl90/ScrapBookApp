import React from 'react';

const InlineTextInput = ({ value, onChange, onBlur, onKeyDown, style }) => {
  return (
    <input
      type="text"
      className="inline-text-input"
      style={style}
      value={value}
      onChange={onChange}
      onBlur={onBlur} // Called when the input loses focus
      onKeyDown={onKeyDown} // Called for key presses like 'Enter'
      autoFocus
      onFocus={(e) => e.target.select()} // Automatically select all text on focus
    />
  );
};

export default InlineTextInput;