const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});