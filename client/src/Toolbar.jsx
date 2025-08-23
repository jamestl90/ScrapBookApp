import React from 'react';

function Toolbar({ onAddItem, onSave }) { 
  return (
    <div className="toolbar">
      {/* Pass 'text' to the onAddItem function */}
      <button onClick={() => onAddItem('text')}>Add Text</button>
      <button>Add Image</button>
      <button>Record Audio</button>
      <button onClick={onSave} style={{ marginLeft: '20px' }}>
        Save
      </button>
    </div>
  );
}

export default Toolbar;