import React from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';

const CanvasImage = ({ src, image: _image, fill: _fill, ...props }) => {
  const [image] = useImage(src, 'Anonymous');

  return (
    <Image
      image={image}
      {...props} 
    />
  );
};

export default CanvasImage;