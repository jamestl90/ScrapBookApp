import { useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { Outlet } from 'react-router-dom';
import './App.css';

function App() {
  const [rectangles, setRectangles] = useState([
    {
      x: 20,
      y: 20,
      width: 100,
      height: 100,
      fill: 'royalblue',
      id: 'rect1'
    }
  ]);

  const handleDragEnd = (e) => {
    const id = e.target.id();
    const newRects = rectangles.slice(); // Create a copy of the array
    const rectToUpdate = newRects.find((r) => r.id === id);
    rectToUpdate.x = e.target.x();
    rectToUpdate.y = e.target.y();
    setRectangles(newRects);
  };

  return (
    <div className="App">
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;