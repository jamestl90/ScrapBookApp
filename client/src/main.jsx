import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import HomePage from './HomePage.jsx';
import ScrapbookPage from './ScrapbookPage.jsx';
import './index.css';
import 'prosemirror-view/style/prosemirror.css';

// Define the application's routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App component will now act as the main layout
    children: [
      {
        index: true, // This makes HomePage the default child route for '/'
        element: <HomePage />,
      },
      {
        path: 'scrapbook/:scrapbookId', // A dynamic route for each scrapbook
        element: <ScrapbookPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);