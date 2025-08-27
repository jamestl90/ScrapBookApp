import { useNavigate, useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Group, Text } from 'react-konva';
import html2canvas from 'html2canvas'; 

import Toolbar from './Toolbar';
import CanvasImage from './CanvasImage';
import RichTextEditor from './RichTextEditor';
import AudioRecorder from './AudioRecorder';
import AudioPlayer from './AudioPlayer';

let idCounter = 2;

function ScrapbookPage() {

  const navigate = useNavigate();
  const { scrapbookId } = useParams();
  const [items, setItems] = useState([]);
  const [selectedId, selectShape] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, visible: false });
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState(false);
  const trRef = useRef();
  const layerRef = useRef();
  const popoverRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const savedStateRef = useRef(null);

  const handleBackToHome = () => {
    const isActuallyDirty = JSON.stringify(items) !== savedStateRef.current;

    if (!isActuallyDirty) {
      navigate('/');
      return;
    }

    const confirmLeave = window.confirm(
      'You have unsaved changes. Are you sure you want to leave?'
    );

    if (confirmLeave) {
      navigate('/');
    }
  };

  const handleAudioTextChange = (itemId, newText) => {
    const newItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, text: newText };
      }
      return item;
    });
    setItems(newItems);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioStreamRef.current = stream;
      
      setIsRecording(true);
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();

    } catch (err) {
      console.error('Error starting audio recording:', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Move the logic into the onstop handler
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        console.log('Audio Blob created:', { 
          size: audioBlob.size, 
          type: audioBlob.type 
        });

        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        uploadFile(audioFile);
        
        // Now that the work is done, update the state
        setIsRecording(false);
        setIsAudioPanelOpen(false);

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null; // Clear the ref
        }
      };

      // Just call stop(). The onstop handler will do the rest.
      mediaRecorderRef.current.stop();
    }
  };

  const handleSave = () => {
    const itemsToSave = JSON.stringify(items); 
    
    fetch(`/api/save/${scrapbookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: itemsToSave,
    })
    .then(response => response.json())
    .then(data => {
      // After a successful save, the new "clean" state is what we just saved.
      savedStateRef.current = itemsToSave;
      console.log('Server response:', data.message);
    })
    .catch((error) => console.error('Error:', error));
  };

  useEffect(() => {
    fetch(`/api/load/${scrapbookId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
          // Store the loaded data as the "clean" state.
          savedStateRef.current = JSON.stringify(data);
          if (data.length > 0) {
            const maxId = Math.max(...data.map(item => parseInt(item.id.replace('item', '')) || 0));
            idCounter = maxId + 1;
          }
        }
      })
      .catch(err => {
        setItems([]);
        savedStateRef.current = JSON.stringify([]); // On error, an empty canvas is the clean state.
        console.error("Failed to load scrapbook data:", err)
      });
  }, [scrapbookId]);

  const handleEditingDone = async () => {
    if (!editingItem || !popoverRef.current) return;

    const editorNode = popoverRef.current.querySelector('.ProseMirror');
    const clone = editorNode.cloneNode(true);

    const bgColor = editingItem.backgroundColor === 'transparent' ? null : editingItem.backgroundColor;

    // Trim any trailing empty paragraph tags from the clone.
    while (
      clone.lastChild &&
      (clone.lastChild.textContent.trim() === '' || clone.lastChild.innerHTML === '<br>')
    ) {
      clone.removeChild(clone.lastChild);
    }
    
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      backgroundColor: bgColor, 
      logging: false, 
    });
    const dataUrl = canvas.toDataURL('image/png');
    document.body.removeChild(clone);

    const newItems = items.slice();
    const itemToUpdate = newItems.find(i => i.id === editingItem.id);
    if (itemToUpdate) {
      itemToUpdate.image = dataUrl;
      itemToUpdate.text = '';
      itemToUpdate.width = canvas.width;
      itemToUpdate.height = canvas.height;
    }
    setItems(newItems);
    setEditingItem(null);
    setPopoverPosition({ visible: false });
  };

  const handleBgChange = (newColor) => {
    if (!editingItem) return;
    
    setEditingItem(prev => ({ ...prev, backgroundColor: newColor }));

    const newItems = items.slice();
    const itemToUpdate = newItems.find(i => i.id === editingItem.id);
    if (itemToUpdate) {
      itemToUpdate.backgroundColor = newColor;
      setItems(newItems);
    }
  };

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

  const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/upload', { method: 'POST', body: formData, })
      .then((res) => res.json())
      .then((data) => {
        if (data.filePath) {
          const newId = `item${idCounter++}`;
          
          let newItem;
          if (file.type.startsWith('image/')) {
            newItem = { 
              type: 'image', x: 50, y: 50, width: 200, height: 200, src: data.filePath, id: newId, 
              rotation: 0, scaleX: 1, scaleY: 1,
              offsetX: 100, offsetY: 100,
            };
          } else if (file.type.startsWith('audio/')) {
            newItem = {
              type: 'audio', id: newId,
              x: window.innerWidth / 2 - 100, 
              y: window.innerHeight / 2 - 30,
              src: data.filePath,
              text: 'Recording Name', // Default editable text
              width: 200, height: 60, // Default size for the audio player
              rotation: 0, scaleX: 1, scaleY: 1,
              offsetX: 100, offsetY: 30,
            };
          }

          if (newItem) {
            setItems((prevItems) => [...prevItems, newItem]);
          }
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
          uploadFile(file);
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

  const handleTransformEnd = (e) => {
    const node = e.target;
    const id = node.id();
    const newItems = items.slice();
    const itemToUpdate = newItems.find((i) => i.id === id);

    if (itemToUpdate) {
      itemToUpdate.x = node.x();
      itemToUpdate.y = node.y();
      itemToUpdate.rotation = node.rotation();
      itemToUpdate.scaleX = node.scaleX();
      itemToUpdate.scaleY = node.scaleY();
    }
    
    setItems(newItems);
  };

  const addItem = (type) => {
    const newId = `item${idCounter++}`;
    if (type === 'text') {
      const newItem = {
        type: 'text', x: 50, y: 50, id: newId,
        html: '<p style="color: #ffffff">Double click to edit</p>',
        text: 'Double click to edit',
        fill: '#000', fontSize: 24,
        image: null, width: 200, height: 50,
        //backgroundColor: '#333333',
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      };
      setItems([...items, newItem]);
    }
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
      if (editingItem) {
        handleEditingDone();
      }
      setEditingItem(null);
      setPopoverPosition({ visible: false }); // Hide popover
    }
  };

  return (
    <>
      <button onClick={handleBackToHome} className="back-to-home-button">
        &larr; Home
      </button>
      <Toolbar onAddItem={addItem} onSave={handleSave} 
        onFileSelect={uploadFile} onRecordAudio={() => setIsAudioPanelOpen(true)} />
      {popoverPosition.visible && (
        <div ref={popoverRef} style={{ position: 'absolute', top: popoverPosition.top, left: popoverPosition.left, zIndex: 100 }} >
          <RichTextEditor
            content={editingItem.html}
            onUpdate={handleTextUpdate}
            bgColor={editingItem.backgroundColor}
            onBgChange={handleBgChange}
          />
        </div>
      )}
      {isAudioPanelOpen && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100
        }}>
          <AudioRecorder
            isRecording={isRecording}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
          />
        </div>
      )}
      <Stage width={window.innerWidth} height={window.innerHeight} onMouseDown={checkDeselect} onTouchStart={checkDeselect}>
        <Layer ref={layerRef}>
          {items.map((item) => {
            if (item.type === 'rect') {
              return <Rect key={item.id} id={item.id} {...item} draggable onDragEnd={handleDragEnd} onClick={() => selectShape(item.id)} onTap={() => selectShape(item.id)} />;
            } 
            // Image rendering 
            else if (item.type === 'image') {
              return (
                <CanvasImage 
                  key={item.id} 
                  id={item.id} {...item} 
                  draggable onDragEnd={handleDragEnd} 
                  onClick={() => selectShape(item.id)} 
                  onTap={() => selectShape(item.id)} 
                />
              );
            } 
            // Text image rendering
            else if (item.type === 'text') {
              if (item.image) {
                return (
                  <CanvasImage
                    key={item.id}
                    id={item.id}
                    {...item} 
                    src={item.image} 
                    draggable
                    onDragEnd={handleDragEnd}
                    onClick={() => selectShape(item.id)}
                    onTap={() => selectShape(item.id)}
                    onDblClick={(e) => { 
                      const node = e.currentTarget;
                      const stage = node.getStage();
                      const stageBox = stage.container().getBoundingClientRect();
                      const nodeBox = node.getClientRect({ relativeTo: stage });

                      setPopoverPosition({
                        visible: true,
                        left: stageBox.left + nodeBox.x,
                        top: stageBox.top + nodeBox.y + nodeBox.height + 5,
                      });
                      setEditingItem(item);
                      selectShape(null); 
                    }}
                  />
                );
              }
              // Placeholder text rendering 
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
            else if (item.type === 'audio') {
              return (
                <AudioPlayer
                  key={item.id}
                  id={item.id}
                  {...item} 
                  draggable
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    if (e.evt.detail === 2) return;
                    selectShape(item.id);
                  }}
                  onTap={() => selectShape(item.id)}
                  onTextChange={(newText) => handleAudioTextChange(item.id, newText)}
                />
              );
            }
            return null;
          })}
          <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => 
            { if (newBox.width < 5 || newBox.height < 5) { return oldBox; } return newBox; }
          } onTransformEnd={handleTransformEnd} />
        </Layer>
      </Stage>
    </>
  );
}

export default ScrapbookPage;