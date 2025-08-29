import React, { useState, useRef, useEffect } from 'react';
import { FaHome, FaSave, FaEllipsisV, FaUndo, FaRedo } from 'react-icons/fa';
import './TopBar.css';

const TopBar = ({ scrapbookId, onBack, onSave, onDelete, onRename, onUndo, onRedo }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(scrapbookId);
    const textRef = useRef(null);

    useEffect(() => {
        setTitle(scrapbookId);
    }, [scrapbookId]);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        
        if (title !== scrapbookId) {
        onRename(title);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
        if (e.key === 'Escape') {
            setTitle(scrapbookId);
            setIsEditing(false);
            e.target.blur();
        }
    };

    return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button onClick={onBack} className="top-bar-button" title="Back to Home">
          <FaHome />
        </button>
        <div className="scrapbook-title-container">
          {isEditing ? (
            <input
              type="text"
              className="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <div 
              ref={textRef}
              className="scrapbook-title" 
              onDoubleClick={handleDoubleClick}
            >
              {scrapbookId}
            </div>
          )}
        </div>
      </div>
      <div className="top-bar-right">
        <button onClick={onUndo} className="top-bar-button" title="Undo">
          <FaUndo />
        </button>
        <button onClick={onRedo} className="top-bar-button" title="Redo">
          <FaRedo />
        </button>
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