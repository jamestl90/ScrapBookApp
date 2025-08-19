import React from 'react';

function Toolbar({ onAddItem }) { 
  return (
    <div className="toolbar">
      {/* Pass 'text' to the onAddItem function */}
      <button onClick={() => onAddItem('text')}>Add Text</button>
      <button>Add Image</button>
      <button>Record Audio</button>
    </div>
  );
}

export default Toolbar;