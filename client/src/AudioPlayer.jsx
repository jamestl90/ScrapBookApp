import React, { useState, useMemo, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';

const AudioPlayer = ({ src, text, isEditing, width, height, ...props }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // useMemo ensures the Audio object is created only once
  const audio = useMemo(() => new Audio(src), [src]);

  // This effect listens for when the audio finishes playing
  useEffect(() => {
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Group {...props}>
      {/* Background */}
      <Rect width={width} height={height} fill="#f0f0f0" cornerRadius={8} />

      {/* Play/Pause Button */}
      <Text
        text={isPlaying ? '❚❚' : '▶'} // Unicode for Pause and Play
        fontSize={24}
        x={15}
        y={height / 2 - 12}
        fill="#333"
        onClick={handlePlayPause}
        onTap={handlePlayPause}
        cursor="pointer" // This won't work in Konva, but it's good practice
      />

      {/* Recording Name */}
      <Text
        visible={!isEditing}
        name="audio-text"
        text={text}
        fontSize={16}
        x={50}
        y={height / 2 - 8}
        width={width - 60}
        fill="#333"
        // In a future step, we can add onDblClick here to edit the text
      />
    </Group>
  );
};

export default AudioPlayer;