import React from 'react';

const AudioRecorder = ({ isRecording, onStart, onStop }) => {
  return (
    <div className="audio-recorder">
      <div className="audio-controls">
        <button onClick={onStart} disabled={isRecording}>
          Record
        </button>
        <button onClick={onStop} disabled={!isRecording}>
          Stop
        </button>
      </div>
    </div>
  );
};

export default AudioRecorder;