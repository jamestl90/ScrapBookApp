import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [scrapbooks, setScrapbooks] = useState([]);
  const [newScrapbookId, setNewScrapbookId] = useState(() => `new-${Date.now()}`);

  // This effect runs once when the component mounts to load the list of scrapbooks
  useEffect(() => {
    fetch('/api/scrapbooks')
      .then(res => res.json())
      .then(data => {
        setScrapbooks(data);
      })
      .catch(err => console.error("Failed to load scrapbook list:", err));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Scrapbooks</h1>
      <div className="thumbnails">
        <Link to={`/scrapbook/${newScrapbookId}`} className="thumbnail thumbnail-add">
          +
        </Link>

        {scrapbooks.map(id => (
          <Link to={`/scrapbook/${id}`} key={id} className="thumbnail">
            {id}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomePage;