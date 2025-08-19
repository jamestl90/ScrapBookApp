import { useState, useRef, useEffect } from 'react'; 
import { Stage, Layer, Rect, Transformer } from 'react-konva'; 
import CanvasImage from './CanvasImage'; 
import Toolbar from './Toolbar';

let idCounter = 2;

function ScrapbookPage() {
  const [items, setItems] = useState([ 
    {
      type: 'rect', 
      x: 20,
      y: 20,
      width: 100,
      height: 100,
      fill: 'royalblue',
      id: 'rect1'
    }
  ]);

  const [selectedId, selectShape] = useState(null);
  const trRef = useRef();
  const layerRef = useRef();

  // useEffect to attach transformer to selected shape
  useEffect(() => {
    if (selectedId) {
      // Find the corresponding node in the Konva layer
      const shapeNode = layerRef.current.findOne('#' + selectedId);
      // Attach transformer to the node
      trRef.current.nodes([shapeNode]);
      trRef.current.getLayer().batchDraw();
    } else {
      // If no shape is selected, remove transformer
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  // useEffect for handling the delete key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setItems(items.filter((item) => item.id !== selectedId));
        selectShape(null); // Deselect after deleting
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [items, selectedId]);

  const uploadImage = (file) => {
    const formData = new FormData();
    formData.append('image', file);

    fetch('/api/upload', { // Use the proxied API route
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.filePath) {
          const newId = `item${idCounter++}`;
          const newItem = {
            type: 'image',
            x: 50,
            y: 50,
            // We'll use default dimensions for now
            width: 200, 
            height: 200,
            src: data.filePath, // The path from the server
            id: newId,
          };
          setItems((prevItems) => [...prevItems, newItem]);
        }
      })
      .catch((err) => {
        console.error("Error uploading image:", err);
      });
  };

  // Handles file pasting and upload
  useEffect(() => {
    const handlePaste = (e) => {
      e.preventDefault();
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          uploadImage(file);
          break; // Stop after handling the first image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleDragEnd = (e) => {
    const id = e.target.id();
    const newItems = items.slice(); // Create a copy of the array
    const rectToUpdate = newItems.find((r) => r.id === id);
    rectToUpdate.x = e.target.x();
    rectToUpdate.y = e.target.y();
    setItems(newItems);
  };

  const addItem = () => {
    const newId = `rect${idCounter++}`;
    const newItem = {
      type: 'rect',
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
      id: newId,
    };
    setItems([...items, newItem]);
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  return (
    <>
      <Toolbar onAddItem={addItem} />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={checkDeselect} // Add mousedown event
        onTouchStart={checkDeselect} // Add touch event
      >
        <Layer ref={layerRef}>
          {items.map((item) => {
            if (item.type === 'rect') {
              return (
                <Rect
                  key={item.id}
                  id={item.id}
                  {...item} 
                  draggable
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    selectShape(item.id);
                  }}
                  onTap={() => {
                    selectShape(item.id);
                  }}
                />
              );
            }
            else if (item.type === 'image') {
              return (
                <CanvasImage
                  key={item.id}
                  id={item.id}
                  {...item}
                  draggable
                  onDragEnd={handleDragEnd}
                  onClick={() => { selectShape(item.id); }}
                  onTap={() => { selectShape(item.id); }}
                />
              );
            }
            return null; 
          })}
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              // limit resize
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </>
  );
}

export default ScrapbookPage;