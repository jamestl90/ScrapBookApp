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
    const originalName = path.parse(file.originalname).name;
    const extension = path.parse(file.originalname).ext;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${originalName}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({ storage: storage });

// --- API Routes ---
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the ScrapBookApp server!" });
});

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Return the path to the uploaded file
  // The path will be relative to the 'public' directory, e.g., '/uploads/image-12345.png'
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.post('/api/save/:id', (req, res) => {
  const scrapbookId = req.params.id;
  const data = req.body;
  
  // Sanitize the ID to prevent directory traversal attacks (important!)
  const safeId = path.basename(scrapbookId);
  const filePath = path.join(__dirname, 'data', `${safeId}.json`);

  const jsonString = JSON.stringify(data, null, 2);

  fs.writeFile(filePath, jsonString, (err) => {
    if (err) {
      console.error('Error saving data:', err);
      return res.status(500).json({ message: 'Failed to save scrapbook.' });
    }
    console.log(`Scrapbook [${safeId}] saved successfully!`);
    res.status(200).json({ message: 'Scrapbook saved successfully!' });
  });
});

app.get('/api/load/:id', (req, res) => {
  const scrapbookId = req.params.id;
  const safeId = path.basename(scrapbookId);
  const filePath = path.join(__dirname, 'data', `${safeId}.json`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(200).json([]);
      }
      console.error('Error loading data:', err);
      return res.status(500).json({ message: 'Failed to load scrapbook.' });
    }
    res.status(200).json(JSON.parse(data));
  });
});

app.get('/api/scrapbooks', (req, res) => {
  const dataPath = path.join(__dirname, 'data');

  // Read the contents of the 'data' directory
  fs.readdir(dataPath, (err, files) => {
    if (err) {
      // If the directory doesn't exist, return an empty list.
      if (err.code === 'ENOENT') {
        return res.status(200).json([]);
      }
      console.error('Error reading data directory:', err);
      return res.status(500).json({ message: 'Failed to retrieve scrapbooks.' });
    }

    // Filter out any non-JSON files and remove the '.json' extension
    const scrapbookIds = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
      
    res.status(200).json(scrapbookIds);
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});