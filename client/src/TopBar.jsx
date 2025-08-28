import React from 'react';
import { FaHome, FaSave, FaEllipsisV } from 'react-icons/fa';
import './TopBar.css';

const TopBar = ({ scrapbookId, onBack, onSave, onDelete }) => {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button onClick={onBack} className="top-bar-button" title="Back to Home">
          <FaHome />
        </button>
        <div className="scrapbook-title">
          {scrapbookId}
        </div>
      </div>
      <div className="top-bar-right">
        <button onClick={onSave} className="top-bar-button" title="Save Scrapbook">
          <FaSave />
        </button>
        {/* The "More Options" menu for destructive actions */}
        <div className="dropdown">
          <button className="top-bar-button" title="More Options">
            <FaEllipsisV />
          </button>
          <div className="dropdown-content">
            <a href="#" onClick={(e) => { e.preventDefault(); onDelete(); }}>
              Delete Scrapbook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;