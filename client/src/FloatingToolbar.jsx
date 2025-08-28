import React, { useRef } from 'react';
import { FaTrashAlt, FaImage, FaFont, FaMicrophone } from 'react-icons/fa';
import './FloatingToolbar.css';

const FloatingToolbar = ({ onAddItem, onDeleteItem, selectedId }) => {
    const audioButtonRef = useRef(null);
    return (
        <div className="floating-toolbar">
        <button onClick={() => onAddItem('text')} title="Add Text">
            <FaFont />
        </button>
        <button onClick={() => onAddItem('image')} title="Add Image (Upload)">
            <FaImage />
        </button>
        <button 
        ref={audioButtonRef}
        onClick={() => {
            const rect = audioButtonRef.current.getBoundingClientRect();
            onAddItem('audio', { top: rect.top, right: rect.right, height: rect.height });
        }} 
        title="Add Audio Recording">
            <FaMicrophone />
        </button>
        
        {/* Divider */}
        <div className="toolbar-divider" />

        {/* The new, unambiguous Delete Item button */}
        <button 
            onClick={onDeleteItem} 
            title="Delete Selected Item"
            // Disable the button if nothing is selected
            disabled={!selectedId} 
        >
            <FaTrashAlt />
        </button>
        </div>
    );
};

export default FloatingToolbar;