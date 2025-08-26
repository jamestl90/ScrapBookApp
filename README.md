A simple note taking / scrapbooking app. 

Tech Stack Breakdown
The application is built with a modern JavaScript stack, featuring a clear separation between the frontend and backend.
Frontend (Client)
The client-side is a single-page application built using the following technologies:
React: A JavaScript library for building user interfaces with a component-based architecture.
Vite: A fast, next-generation frontend build tool and development server. It provides a quicker development experience through features like Hot Module Replacement (HMR).
React Router (react-router-dom): A library for handling client-side routing, enabling navigation between different views or pages within the single-page application, such as the HomePage and the scrapbook canvas.
Konva & react-konva: Konva is a 2D canvas JavaScript library for creating interactive and high-performance graphics. react-konva provides the React bindings for Konva, allowing you to build canvas graphics declaratively within your React components.
Tiptap: A headless rich-text editor framework. This means it provides the logic for text editing without a built-in user interface, giving you full control over the editor's appearance. It's used in your RichTextEditor.jsx.
html2canvas: A JavaScript library used to capture "screenshots" of web pages or specific elements by rendering the DOM to a canvas image. You use this to convert the edited rich text into a static image on the main canvas.
use-image: A React Hook likely used for asynchronously loading images onto the Konva canvas, handling loading and error states.
Backend (Server)
The server-side is a Node.js application responsible for handling data, file storage, and API requests.
Node.js: A JavaScript runtime environment that executes JavaScript code outside of a web browser, perfect for building server-side applications.
Express: A minimal and flexible Node.js web application framework used to build the application's API. It's considered the de facto standard for Node.js server development.
cors: A Node.js package that provides middleware to enable Cross-Origin Resource Sharing (CORS). This is essential for allowing the frontend (running on a different port during development) to make requests to the backend server.
multer: A Node.js middleware for handling multipart/form-data, which is primarily used for uploading files like the images and audio recordings in your application.
dotenv: A module that loads environment variables from a .env file into process.env, allowing you to keep sensitive information like database credentials or API keys out of your source code.
nodemon: A development utility that automatically restarts the Node.js application when it detects file changes in the source code, speeding up the development workflow.
Basic Functionality Breakdown
Based on your description, the application's workflow and features can be summarized as follows:
Home Screen: The application starts on a HomePage.jsx component. This screen serves as the main entry point, displaying a list of previously saved "work books" and offering a button to create a new one.
Scrapbook Canvas: Creating a new workbook or opening a saved one takes the user to the main canvas interface. This canvas, managed by Konva, is the primary workspace where users can add and manipulate various elements.
Toolbar and Elements: A central toolbar (Toolbar.jsx) allows users to add three types of elements to the canvas:
Text:
When added, it first appears as a placeholder.
Double-clicking this placeholder opens a RichTextEditor.jsx pop-out.
Inside the editor (powered by Tiptap), users can format the text (bold, italic, color, background).
Once editing is complete, html2canvas renders the final styled text into a static, non-editable image that is placed back onto the Konva canvas.
Image:
Users can add images from their local machine.
These images are uploaded to the server (specifically to server/public/uploads) and then rendered as simple, movable, and resizable objects on the canvas.
Audio Recording:
Adding this element opens an AudioRecorder.jsx pop-out with controls to start and stop recording.
Upon completion, the audio data is saved (likely in server/public/uploads), and a custom UI element appears on the canvas.
This AudioPlayer.jsx element includes a play button to listen to the recording and a text label for its name.
The name of the audio clip can be edited directly on the canvas via an InlineTextInput.jsx component that appears on a double-click.
Data Persistence (Development Stage):
Scrapbook "saves," which likely contain the state and positioning of all canvas elements, are stored as files in the server/data directory.
Uploaded media files, such as images and audio recordings, are stored in the server/public/uploads directory. The server uses Express routes to serve these static files to the client.
