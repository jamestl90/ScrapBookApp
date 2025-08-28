import { useNavigate, useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Group, Text } from 'react-konva';
import html2canvas from 'html2canvas'; 
import toast from 'react-hot-toast';

import FloatingToolbar from './FloatingToolbar'; 
import TopBar from './TopBar';
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
  const [audioPanelPosition, setAudioPanelPosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef(null);
  const isPanningRef = useRef(false);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const trRef = useRef();
  const layerRef = useRef();
  const popoverRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const savedStateRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
    e.target.value = null; 
  };

  const handleMouseDown = (e) => {
    // Middle mouse button is usually button number 1
    if (e.evt.button === 1) {
      isPanningRef.current = true;
      const stage = e.target.getStage();
      lastPointerPosRef.current = stage.getPointerPosition();
      stage.container().style.cursor = 'grabbing';
    } else {
      // If not middle mouse, call the original deselect logic
      handleStageMouseDown(e);
    }
  };

  const handleMouseUp = (e) => {
    isPanningRef.current = false;
    const stage = e.target.getStage();
    // Only change cursor if a stage exists
    if (stage && stage.container()) {
      stage.container().style.cursor = 'default';
    }
  };

  const handleMouseMove = (e) => {
    if (isPanningRef.current) {
      const stage = e.target.getStage();
      const newPointerPos = stage.getPointerPosition();
      
      const dx = newPointerPos.x - lastPointerPosRef.current.x;
      const dy = newPointerPos.y - lastPointerPosRef.current.y;

      stage.move({ x: dx, y: dy });
      lastPointerPosRef.current = newPointerPos;
      stage.batchDraw();
    }
  };

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

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) {
      return;
    }

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Directly command the stage to update its scale and position
    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);

    stage.batchDraw();
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
    else {
      // If the panel is open but we aren't recording, just close it.
      setIsAudioPanelOpen(false);
    }
  };
  
  const handleSave = () => {
    const itemsToSave = JSON.stringify(items); 
    
    toast.promise(
      fetch(`/api/save/${scrapbookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: itemsToSave,
      })
      .then(response => {
        if (!response.ok) {
          // Make sure to throw an error on a bad response to trigger the error toast
          throw new Error('Save failed');
        }
        return response.json();
      })
      .then(data => {
        // This runs on success
        savedStateRef.current = itemsToSave;
        // The success message is handled by toast.promise, but you can still log if you want
        console.log('Server response:', data.message);
      }),
      {
        loading: 'Saving scrapbook...',
        success: <b>Scrapbook saved!</b>,
        error: <b>Could not save scrapbook.</b>,
      }
    );
  };

  const handleDeleteScrapbook = () => {
    // Show a confirmation dialog, similar to the back button.
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this scrapbook? This action cannot be undone.'
    );

    if (!confirmDelete) {
      return;
    }

    fetch(`/api/delete/${scrapbookId}`, {
      method: 'DELETE',
    })
    .then(response => {
      // Check if the request was successful
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      toast.success('Scrapbook deleted!');
      console.log('Server response:', data.message);
      navigate('/'); // Redirect to the home page
    })
    .catch((error) => {
      toast.error('Could not delete scrapbook.');
      console.error('Error:', error);
    });
  };

  const handleRename = (newId) => {
    if (!newId || newId.trim() === '') {
      toast.error("Scrapbook name cannot be empty.");
      return;
    }

    toast.promise(
      fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldId: scrapbookId, newId: newId }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Rename failed');
        }
        return response.json();
      })
      .then(data => {
        navigate(`/scrapbook/${data.newId}`, { replace: true });
      }),
      {
        loading: 'Renaming...',
        success: <b>Scrapbook renamed!</b>,
        error: <b>Could not rename scrapbook.</b>,
      }
    );
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
        toast.error("Failed to load scrapbook data.");
        setItems([]);
        savedStateRef.current = JSON.stringify([]); // On error, an empty canvas is the clean state.
        console.error("Failed to load scrapbook data:", err)
      });
  }, [scrapbookId]);

  const handleEditingDone = async () => {
    if (!editingItem || !popoverRef.current) return;

    const editorNode = popoverRef.current.querySelector('.ProseMirror');
    if (!editorNode) return;

    const bgColor = editingItem.backgroundColor === 'transparent' ? null : editingItem.backgroundColor;

    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'absolute';
    renderContainer.style.left = '-9999px';
    renderContainer.style.top = '-9999px';
    renderContainer.style.padding = '4px';
    renderContainer.style.padding = '0';
    renderContainer.style.margin = '0';
    renderContainer.style.display = 'inline-block';
    renderContainer.style.background = bgColor || 'transparent';

    // clone editor content
    const clone = editorNode.cloneNode(true);

    // remove contenteditable so cursor styling doesn't interfere
    clone.removeAttribute('contenteditable');

    // remove trailing empty nodes
    while (clone.lastChild && (clone.lastChild.textContent.trim() === '' || clone.lastChild.innerHTML === '<br>')) {
      clone.removeChild(clone.lastChild);
    }

    const isEmpty = !clone.textContent.trim();

    if (isEmpty) {
      // force a minimum size for empty text
      renderContainer.style.width = '100px';   // or any minimum width
      renderContainer.style.height = '30px';   // or any minimum height
      clone.textContent = '\u200B';
    }

    // remove paragraph/heading margins to collapse vertical space
    clone.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(el => {
      el.style.margin = '0';
    });

    renderContainer.appendChild(clone);
    document.body.appendChild(renderContainer);

    const canvas = await html2canvas(renderContainer, {
      backgroundColor: bgColor,
      scale: 2,
    });
    const dataUrl = canvas.toDataURL('image/png');

    const finalWidth = renderContainer.offsetWidth;
    const finalHeight = renderContainer.offsetHeight;
    document.body.removeChild(renderContainer);

    const newItems = items.slice();
    const itemToUpdate = newItems.find(i => i.id === editingItem.id);
    if (itemToUpdate) {
      itemToUpdate.image = dataUrl;
      itemToUpdate.text = '';
      itemToUpdate.width = finalWidth;
      itemToUpdate.height = finalHeight;
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
        deleteSelectedItem();
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

  const deleteSelectedItem = () => {
    if (selectedId) {
      setItems(items.filter((item) => item.id !== selectedId));
      selectShape(null); // Deselect after deleting
    }
  };

  const addItem = (type, position) => {
    const newId = `item${idCounter++}`;
    if (type === 'text') {
      const newItem = {
        type: 'text', x: 50, y: 50, id: newId,
        html: '', 
        text: 'New Text Box', // This is for the placeholder before editing
        fill: '#000', fontSize: 24,
        image: null, width: 200, height: 50,
        backgroundColor: '#333333', // A default dark background
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      };
      setItems([...items, newItem]);
    } else if (type === 'audio') {
      setAudioPanelPosition({
        top: position.top + position.height / 2,
        left: position.right + 10, // 10px to the right of the button
      });
      setIsAudioPanelOpen(true);
    } else if (type === 'image') {
      fileInputRef.current.click();
    }
  };

  const handleStageMouseDown = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
      if (editingItem) {
        handleEditingDone();
      }
      if (isAudioPanelOpen) {
        handleStopRecording(false); 
      }
      setEditingItem(null);
      setPopoverPosition({ visible: false }); // Hide popover
    }
  };

  return (
    <>
      {/* <Toolbar onAddItem={addItem} onSave={handleSave} onDelete={handleDeleteScrapbook} onFileSelect={uploadFile} onRecordAudio={() => setIsAudioPanelOpen(true)} /> */}
      <TopBar scrapbookId={scrapbookId} onBack={handleBackToHome} onSave={handleSave} onDelete={handleDeleteScrapbook} onRename={handleRename} />
      <FloatingToolbar onAddItem={addItem} onDeleteItem={deleteSelectedItem} selectedId={selectedId} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*" 
      />
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
          top: `${audioPanelPosition.top}px`,
          left: `${audioPanelPosition.left}px`,
          transform: 'translateY(-50%)',
          zIndex: 100
        }}>
          <AudioRecorder
            isRecording={isRecording}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
          />
        </div>
      )}
      <Stage width={window.innerWidth} height={window.innerHeight} 
        onMouseDown={handleMouseDown} // Use the new combined handler
        onMouseUp={handleMouseUp}     // Add this
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onTouchStart={handleStageMouseDown}>
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