import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';

const AudioPlayer = ({ src, text, onTextChange, width, height, ...props }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const textRef = useRef(null);
  const audio = useMemo(() => new Audio(src), [src]);

  useEffect(() => {
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [audio]);

  const handlePlayPause = () => {
    if (isPlaying) audio.pause();
    else {
      audio.currentTime = 0;
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDblClick = () => {
    const textNode = textRef.current;
    if (!textNode) return;

    const stage = textNode.getStage();
    const layer = textNode.getLayer();
    const stageContainer = stage.container();
    const stageBox = stageContainer.getBoundingClientRect();

    const absPos = textNode.absolutePosition();
    const scale = textNode.getAbsoluteScale();

    const areaPosition = {
      x: stageBox.left + absPos.x,
      y: stageBox.top + absPos.y,
    };

    textNode.hide();
    layer.draw();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    
    const fontSizePx = textNode.fontSize() * scale.y;
    const padX = (textNode.padding?.() ?? 0) * scale.x;
    const padY = (textNode.padding?.() ?? 0) * scale.y;

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.top = `${areaPosition.y - 1}px`;              // baseline shim (~1–2px)
    textarea.style.width = `${textNode.width() * scale.x - padX * 2}px`;
    textarea.style.height = `${textNode.height() * scale.y - padY * 2}px`;
    textarea.style.fontSize = `${fontSizePx}px`;
    textarea.style.lineHeight = `${textNode.lineHeight() * fontSizePx}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();
    textarea.style.padding = '0';
    textarea.style.margin = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.background = 'white';
    textarea.style.overflow = 'hidden';
    textarea.style.zIndex = '1000';
    textarea.style.transformOrigin = 'left top';
    textarea.focus();

    const removeTextarea = () => {
      if (document.body.contains(textarea)) {
        onTextChange(textarea.value);
        document.body.removeChild(textarea);
        textNode.show();
        layer.draw();
      }
    };
    textarea.addEventListener('blur', removeTextarea);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') removeTextarea();
    });
  };

  return (
    <Group {...props}>
      <Rect width={width} height={height} fill="#f0f0f0" cornerRadius={8} />
      <Text 
        text={isPlaying ? '❚❚' : '▶'} 
        fontSize={24} 
        x={15} 
        y={height/2 - 12} 
        fill="#333" onClick={handlePlayPause} 
        onTap={handlePlayPause} />
      <Text 
        ref={textRef} 
        text={text} 
        fontSize={16} 
        x={50} 
        y={height/2 - 8} 
        width={width-60} 
        fill="#333" 
        onDblClick={handleDblClick} 
        onDblTap={handleDblClick} />
    </Group>
  );
};

export default AudioPlayer;