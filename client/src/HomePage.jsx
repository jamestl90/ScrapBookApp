import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

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

  const handleClearCache = () => {
    // Show a confirmation dialog because this is a destructive action
    const confirmClear = window.confirm(
      'Are you sure you want to clear the server cache? This will permanently delete all unused images and audio files from the server.'
    );

    if (!confirmClear) {
      return;
    }

    // Use toast.promise for clear feedback during the async operation
    toast.promise(
      fetch('/api/cleanup-uploads', {
        method: 'POST',
      })
      .then(response => {
        if (!response.ok) {
          // Throw an error to trigger the error toast
          throw new Error('Cleanup failed');
        }
        return response.json();
      }),
      {
        loading: 'Cleaning up server files...',
        // The success message can be a function that receives the API response
        success: (data) => <b>{data.message || 'Cleanup successful!'}</b>,
        error: <b>Could not clean up files.</b>,
      }
    );
  };

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
      <div style={{ marginTop: '40px' }}>
        <button onClick={handleClearCache}>
          Clear Server Cache
        </button>
      </div>
    </div>
  );
}

export default HomePage;