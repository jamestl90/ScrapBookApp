import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Group, Text } from 'react-konva';
import * as htmlToImage from 'html-to-image';

import Toolbar from './Toolbar';
import CanvasImage from './CanvasImage';
import RichTextEditor from './RichTextEditor';

let idCounter = 2;

function ScrapbookPage() {
  const [items, setItems] = useState([
    {
      type: 'rect', x: 20, y: 20, width: 100, height: 100, fill: 'royalblue', id: 'rect1'
    }
  ]);

  const [selectedId, selectShape] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // --- POSITIONING FIX START: New state for manual popover position ---
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, visible: false });
  // --- POSITIONING FIX END ---

  const trRef = useRef();
  const layerRef = useRef();

  useEffect(() => {
    if (selectedId && !editingItem) {
      const shapeNode = layerRef.current.findOne('#' + selectedId);
      trRef.current.nodes([shapeNode]);
      trRef.current.getLayer().batchDraw();
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId, editingItem]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setItems(items.filter((item) => item.id !== selectedId));
        selectShape(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedId]);

  const uploadImage = (file) => {
    const formData = new FormData();
    formData.append('image', file);
    fetch('/api/upload', { method: 'POST', body: formData, })
      .then((res) => res.json())
      .then((data) => {
        if (data.filePath) {
          const newId = `item${idCounter++}`;
          const newItem = { type: 'image', x: 50, y: 50, width: 200, height: 200, src: data.filePath, id: newId, };
          setItems((prevItems) => [...prevItems, newItem]);
        }
      })
      .catch((err) => console.error("Error uploading image:", err));
  };

  useEffect(() => {
    const handlePaste = (e) => {
      e.preventDefault();
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          uploadImage(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDragEnd = (e) => {
    const id = e.target.id();
    const newItems = items.slice();
    const itemToUpdate = newItems.find((r) => r.id === id);
    if(itemToUpdate) {
      itemToUpdate.x = e.target.x();
      itemToUpdate.y = e.target.y();
      setItems(newItems);
    }
    // Hide popover on drag
    if(editingItem && editingItem.id === id) {
      setPopoverPosition({ visible: false });
    }
  };

  const addItem = (type) => {
    const newId = `item${idCounter++}`;
    if (type === 'text') {
      const newItem = {
        type: 'text', x: 50, y: 50, id: newId,
        html: '<p>Double click to edit</p>', text: 'Double click to edit',
        fill: '#000', fontSize: 24,
        image: null, width: 200, height: 50,
      };
      setItems([...items, newItem]);
    }
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
      setEditingItem(null);
      setPopoverPosition({ visible: false }); // Hide popover
    }
  };

  const handleTextUpdate = (htmlContent) => {
    if (!editingItem) return;
    const newItems = items.slice();
    const itemToUpdate = newItems.find(i => i.id === editingItem.id);
    if (itemToUpdate) {
      itemToUpdate.html = htmlContent;
      // Convert HTML to plain text for live canvas preview
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      itemToUpdate.text = tempDiv.textContent || tempDiv.innerText || '';
      setItems(newItems);
    }
  };

  return (
    <>
      <Toolbar onAddItem={addItem} />
      {popoverPosition.visible && (
        <div style={{ position: 'absolute', top: popoverPosition.top, left: popoverPosition.left, zIndex: 100 }} >
          <RichTextEditor
            content={editingItem.html}
            onUpdate={handleTextUpdate}
          />
        </div>
      )}
      <Stage width={window.innerWidth} height={window.innerHeight} onMouseDown={checkDeselect} onTouchStart={checkDeselect}>
        <Layer ref={layerRef}>
          {items.map((item) => {
            if (item.type === 'rect') {
              return <Rect key={item.id} id={item.id} {...item} draggable onDragEnd={handleDragEnd} onClick={() => selectShape(item.id)} onTap={() => selectShape(item.id)} />;
            } else if (item.type === 'image') {
              return <CanvasImage key={item.id} id={item.id} {...item} draggable onDragEnd={handleDragEnd} onClick={() => selectShape(item.id)} onTap={() => selectShape(item.id)} />;
            } else if (item.type === 'text') {
              return (
                <Group
                  key={item.id} id={item.id} x={item.x} y={item.y}
                  draggable onDragEnd={handleDragEnd}
                  onClick={() => selectShape(item.id)} onTap={() => selectShape(item.id)}
                  onDblClick={(e) => {
                    const node = e.currentTarget;
                    const stage = node.getStage();
                    const stageBox = stage.container().getBoundingClientRect();
                    const nodeBox = node.getClientRect({ relativeTo: stage });

                    setPopoverPosition({
                      visible: true,
                      left: stageBox.left + nodeBox.x,
                      top: stageBox.top + nodeBox.y + nodeBox.height + 5, // Position below the text
                    });
                    setEditingItem(item);
                    selectShape(null);
                  }}
                >
                  <Rect width={item.width} height={item.height} fill="#eee" />
                  <Text
                    text={item.text} width={item.width} height={item.height}
                    fill={item.fill} fontSize={item.fontSize}
                    padding={5} verticalAlign="middle" listen={false} // Make text non-interactive, group handles events
                  />
                </Group>
              );
            }
            return null;
          })}
          <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => { if (newBox.width < 5 || newBox.height < 5) { return oldBox; } return newBox; }} />
        </Layer>
      </Stage>
    </>
  );
}

export default ScrapbookPage;