const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 
const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Save files to the 'public/uploads' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid overwriting files
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- API Routes ---
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the ScrapBookApp server!" });
});

// File Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Return the path to the uploaded file
  // The path will be relative to the 'public' directory, e.g., '/uploads/image-12345.png'
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.post('/api/save', (req, res) => {
  const data = req.body; // The `items` array from the client
  const filePath = path.join(__dirname, 'scrapbook-data.json'); // Define where to save the file

  // Convert the JavaScript object to a JSON string with nice formatting
  const jsonString = JSON.stringify(data, null, 2);

  // Write the string to the file
  fs.writeFile(filePath, jsonString, (err) => {
    if (err) {
      console.error('Error saving data:', err);
      // Send an error response back to the client
      return res.status(500).json({ message: 'Failed to save scrapbook.' });
    }
    console.log('Scrapbook data saved successfully!');
    // Send a success response back to the client
    res.status(200).json({ message: 'Scrapbook saved successfully!' });
  });
});

app.get('/api/load', (req, res) => {
  const filePath = path.join(__dirname, 'scrapbook-data.json');

  // Read the file from the disk
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      // If the file doesn't exist yet, it's not a critical error.
      // We can send back an empty array, which means a new scrapbook.
      if (err.code === 'ENOENT') {
        return res.status(200).json([]);
      }
      console.error('Error loading data:', err);
      return res.status(500).json({ message: 'Failed to load scrapbook.' });
    }
    
    // Parse the JSON string back into a JavaScript object and send it
    res.status(200).json(JSON.parse(data));
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});