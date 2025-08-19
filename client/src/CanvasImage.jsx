import React from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';

const CanvasImage = ({ src, ...props }) => {
  const [image] = useImage(src, 'Anonymous');

  return (
    <Image
      image={image}
      {...props} 
    />
  );
};

export default CanvasImage;