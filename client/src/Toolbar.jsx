import React, { useRef } from 'react';

function Toolbar({ onAddItem, onSave, onFileSelect, onRecordAudio }) {
  const fileInputRef = useRef(null);

  const handleAddImageClick = () => {
    // Trigger the hidden file input's click event
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = null; 
  };

  return (
    <div className="toolbar">
      {/* Pass 'text' to the onAddItem function */}
      <button onClick={() => onAddItem('text')}>Add Text</button>
      <button onClick={handleAddImageClick}>Add Image</button>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" // Only allow image files
        onChange={handleFileChange} 
      />
      <button onClick={onRecordAudio}>Record Audio</button>
      <button onClick={onSave} style={{ marginLeft: '20px' }}>
        Save
      </button>
    </div>
  );
}

export default Toolbar;