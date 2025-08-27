import { Image as KonvaImage } from 'react-konva';
import { useEffect, useState } from 'react';

// --- START OF MODIFICATION ---
// We destructure 'image' and rename it to '_' (a throwaway variable)
// to prevent it from being included in the '...props' spread.
export default function CanvasImage({ src, image: _, ...props }) {
// --- END OF MODIFICATION ---
  const [imageObj, setImageObj] = useState(null);

  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => setImageObj(img);
    img.src = src;
  }, [src]);

  if (!imageObj) return null;

  // Now, '...props' will never contain the conflicting 'image' string prop
  return (
    <KonvaImage
      image={imageObj}
      {...props}
    />
  );
}