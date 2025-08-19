import React from 'react';
// We will use Link to navigate to a scrapbook later
// import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h1>My Scrapbooks</h1>
      <div className="thumbnails">
        {/* We will map over real data here later */}
        <div className="thumbnail-add">
          +
        </div>
      </div>
    </div>
  );
}

export default HomePage;