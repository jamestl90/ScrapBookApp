Disclaimer: This app was largely an exercise in using AI to accelerate development. I used Google AI Studio to assist in generating code for many functions in this project. Unit tests would be required to properly verify the correctness of the generated code as it would my own written code. 

<h2>Live Demo</h2>
Hosted by render.com, might take a moment to spin up if it's been inactive for awhile. </br>
Play around with the app here: 
https://scrapbookapp-6xn8.onrender.com/ </br>
Taskboard for this app: https://trello.com/b/yqbvpTog/scrapbookapp

# ScrapBook Note-Taking App

ScrapBook is a dynamic and interactive note-taking application that utilizes a canvas-based interface. It allows users to visually organize their thoughts by adding and manipulating rich text, images, and audio recordings in a freeform workspace.

## Tech Stack

The application is built with a modern JavaScript stack, featuring a decoupled frontend and backend for a scalable and maintainable architecture.

### Frontend (Client)

The client is a responsive single-page application built for a seamless user experience.

React: Javascript. Well established front-end ecosystem.

Vite: Minimal config dev server.

React Router (react-router-dom): Handles client-side routing.

Konva & react-konva: 2D canvas library which suits the requirements for this project - fast node editing, graphical manipulations.

Tiptap: Rich text editor toolkit.

html2canvas: A utility that renders DOM elements into canvas images, used here to convert styled rich text into a static image asset for the Konva canvas.

### Backend (Server)

The server is a lightweight and efficient Node.js application designed to handle API requests, file uploads, and data persistence.

Node.js: A JavaScript runtime used to build fast and scalable server-side applications.

Express: Web app framework for building REST api. Standard for server-side abstractions. 

cors: Middleware to enable Cross-Origin Resource Sharing, allowing the frontend application to securely communicate with the backend API.

multer: A Node.js middleware for handling multipart/form-data, which is essential for managing file uploads like images and audio recordings.

nodemon: A development utility that automatically restarts the server upon detecting file changes, streamlining the development process.

dotenv: Manages environment variables, keeping sensitive configuration (API keys or database strings) separate from the source code.

## Core Features
## Home Screen & Workbook Management

The application opens to a central home screen that displays a gallery of previously saved workbooks. From here, users can either select an existing project to continue their work or start a new, blank scrapbook canvas.

## The Interactive Canvas

The core of the application is a freeform canvas where users have the freedom to add, move, resize, and layer different types of media. This provides a flexible and creative space for note-taking and brainstorming.

## Canvas Elements

A main toolbar provides access to the core elements that can be added to the canvas:

**Text Blocks**

Rich Text Editing: Double-clicking a text element opens a pop-out rich-text editor powered by Tiptap.

Styling Options: Users can style text with options like bold, italic, font size, text color, and background highlighting.

Canvas Rendering: After editing, html2canvas converts the styled text block into a static image, which is then rendered onto the main canvas to ensure visual consistency and performance.

**Images**

Users can upload images from their local system.

The server processes these uploads, and the images are rendered on the canvas where they can be freely positioned and resized.

**Audio Recordings**

In-App Recording: An audio recording module allows users to capture audio directly within the app.

Canvas Player: Once a recording is complete, a custom UI element appears on the canvas. This element includes a play button and an editable title.

Inline Title Editing: The title of the audio clip can be quickly renamed by double-clicking the text, which activates an inline input field.

## Data Persistence (For Development)

Scrapbook State: The layout, content, and positions of all elements on a canvas are saved as structured data files (e.g., JSON) in the server/data/ directory.

File Storage: All uploaded media assets, including images and audio files, are stored in the server/public/uploads/ directory and served statically by the Express server.

## Future Developments

1. Free hand drawing
