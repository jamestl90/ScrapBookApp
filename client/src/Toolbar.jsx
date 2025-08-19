import React from 'react';

function Toolbar({ onAddItem }) {
  const handleAddText = () => {
    console.log("Add Text button clicked");
    onAddItem();
  };

  return (
    <div className="toolbar">
      <button onClick={handleAddText}>Add Text</button>
      <button>Add Image</button>
      <button>Record Audio</button>
    </div>
  );
}

export default Toolbar;