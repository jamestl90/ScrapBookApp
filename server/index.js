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

// Increase request body limit (to allow larger images to save)
app.use(express.json({ limit: '1000mb' }));

// --- Multer Storage Configuration ---
const uploadsDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

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
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

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
        // If the file doesn't exist, it's a new scrapbook. Send an empty array.
        return res.status(200).json([]);
      }
      console.error('Error loading data:', err);
      return res.status(500).json({ message: 'Failed to load scrapbook.' });
    }
    
    try {
      const savedData = JSON.parse(data);
      if (Array.isArray(savedData)) {
        // It's the old format. Send it back directly for backwards compatibility.
        res.status(200).json(savedData);
      } else if (savedData && savedData.items) {
        // It's the new format. Send back ONLY the 'items' array.
        // The client only needs the item data to render the canvas.
        res.status(200).json(savedData.items);
      } else {
        // The file is in an unknown or corrupted format. Treat it as empty.
        console.warn(`Scrapbook [${safeId}] has an unknown format. Loading as empty.`);
        res.status(200).json([]);
      }
    } catch (parseError) {
      // If the JSON is malformed, we can't read it. Treat it as an error.
      console.error(`Error parsing JSON for scrapbook [${safeId}]:`, parseError);
      return res.status(500).json({ message: 'Failed to load scrapbook due to corrupted data.' });
    }
  });
});

app.delete('/api/delete/:id', (req, res) => {
  const scrapbookId = req.params.id;
  const safeId = path.basename(scrapbookId); // Sanitize ID for security
  const filePath = path.join(__dirname, 'data', `${safeId}.json`);

  // fs.unlink is the Node.js function to delete a file
  fs.unlink(filePath, (err) => {
    if (err) {
      // If the file doesn't exist, it's not an error in this case.
      // The goal is for the file to be gone, and it already is.
      if (err.code === 'ENOENT') {
        console.log(`Attempted to delete scrapbook [${safeId}], but it was not found.`);
        return res.status(200).json({ message: 'Scrapbook not found, but considered deleted.' });
      }
      // For any other errors (e.g., permissions), send a server error.
      console.error('Error deleting data:', err);
      return res.status(500).json({ message: 'Failed to delete scrapbook.' });
    }
    console.log(`Scrapbook [${safeId}] deleted successfully!`);
    res.status(200).json({ message: 'Scrapbook deleted successfully!' });
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

app.post('/api/rename', (req, res) => {
  const { oldId, newId } = req.body;

  if (!oldId || !newId) {
    return res.status(400).json({ message: 'Old and new IDs are required.' });
  }

  const safeOldId = path.basename(oldId);
  const safeNewId = path.basename(newId);

  const oldFilePath = path.join(__dirname, 'data', `${safeOldId}.json`);
  const newFilePath = path.join(__dirname, 'data', `${safeNewId}.json`);

  fs.rename(oldFilePath, newFilePath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ message: 'Scrapbook to rename not found.' });
      }
      console.error('Error renaming data:', err);
      return res.status(500).json({ message: 'Failed to rename scrapbook.' });
    }
    console.log(`Scrapbook [${safeOldId}] renamed to [${safeNewId}] successfully!`);
    res.status(200).json({ message: 'Scrapbook renamed successfully!', newId: safeNewId });
  });
});

app.post('/api/cleanup-uploads', (req, res) => {
  console.log('Cleanup process started...');

  const dataPath = path.join(__dirname, 'data');
  const uploadsPath = path.join(__dirname, 'public', 'uploads');
  
  // Grace period in milliseconds (e.g. 24 hours)
  // Any unreferenced file older than this will be deleted.
  const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Compile a master list of all files that are currently in use.
  const protectedFiles = new Set();
  
  try {
    const scrapbookFiles = fs.readdirSync(dataPath).filter(file => file.endsWith('.json'));

    for (const file of scrapbookFiles) {
      const filePath = path.join(dataPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const scrapbookData = JSON.parse(fileContent);

      // Add files from the new 'usedUploads' property to our protected set
      if (scrapbookData && scrapbookData.usedUploads && Array.isArray(scrapbookData.usedUploads)) {
        scrapbookData.usedUploads.forEach(uploadPath => {
          // We only care about the filename, not the full path
          protectedFiles.add(path.basename(uploadPath));
        });
      }
    }
    console.log(`Found ${protectedFiles.size} protected files across all scrapbooks.`);
  } catch (err) {
    console.error('Error reading scrapbook data during cleanup:', err);
    return res.status(500).json({ message: 'Failed to read scrapbook data.' });
  }

  // Scan the uploads directory and delete orphaned files.
  try {
    const uploadedFiles = fs.readdirSync(uploadsPath);
    let deletedCount = 0;

    for (const file of uploadedFiles) {
      // Check if the file is protected
      if (protectedFiles.has(file)) {
        continue; // Skip this file, it's in use
      }

      const filePath = path.join(uploadsPath, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs; // Time since last modification

      // Check if the file is older than our grace period
      if (fileAge > GRACE_PERIOD_MS) {
        console.log(`Deleting orphaned file: ${file}`);
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    console.log(`Cleanup process finished. Deleted ${deletedCount} orphaned file(s).`);
    res.status(200).json({ message: `Cleanup successful. Deleted ${deletedCount} file(s).` });
  } catch (err) {
    console.error('Error during file cleanup:', err);
    return res.status(500).json({ message: 'An error occurred during cleanup.' });
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});