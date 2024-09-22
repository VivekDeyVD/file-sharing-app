require('dotenv').config();  // Loads environment variables from the .env file
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const File = require('./models/File'); // Import the File model

const app = express();
const port = 3000;

app.use('/uploads', express.static('uploads'));


// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Set up Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Save files in 'uploads/' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // Rename the file to avoid duplicates
  }
});

const upload = multer({ storage: storage });

// Serve the HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Save file metadata to MongoDB
    const newFile = new File({
      originalName: file.originalname,
      size: file.size,
      path: file.path,
    });

    await newFile.save();  // Save to MongoDB

    res.send(`File uploaded successfully! File ID: ${newFile._id}`);
  } catch (err) {
    console.error('Error saving metadata:', err);
    res.status(500).send('Failed to upload file and save metadata.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// app.get('/view/:id', async (req, res) => {
//     try {
//       // Find the image in the database using its ID
//       const file = await File.findById(req.params.id);
  
//       if (!file) {
//         return res.status(404).send('Image not found');
//       }
  
//       // Get the image's file path
//       const imagePath = path.join(__dirname, file.path);
  
//       // Send the image to the browser for viewing
//       res.sendFile(imagePath); // This will display the image in the browser
//     } catch (err) {
//       console.error('Error fetching image:', err);
//       res.status(500).send('Error occurred during image retrieval');
//     }
//   });

app.get('/view/:id', async (req, res) => {
    try {
      // Find the image in the database using its ID
      const file = await File.findById(req.params.id);
  
      if (!file) {
        return res.status(404).send('Image not found');
      }
  
      // Generate the HTML that shows the image and includes the download button
      const imagePath = `/uploads/${file.filename}`; // Assuming the images are stored in the "uploads" folder
      const downloadUrl = `/download/${file._id}`; // URL for downloading the image
  
      // Send a simple HTML page with the image and a download button
      res.send(`
        <html>
          <head><title>View Image</title></head>
          <body>
            <h1>View Image</h1>
            <img src="${imagePath}" alt="Image" style="max-width: 100%; height: auto;"/><br/>
            <a href="${downloadUrl}">
              <button style="margin-top: 10px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; cursor: pointer;">
                Download Image
              </button>
            </a>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Error fetching image:', err);
      res.status(500).send('Error occurred during image retrieval');
    }
  });
  

  app.get('/download/:id', async (req, res) => {
    try {
      // Find the image in the database using its ID
      const file = await File.findById(req.params.id);
  
      if (!file) {
        return res.status(404).send('Image not found');
      }
  
      // Get the image's file path
      const imagePath = path.join(__dirname, file.path);
  
      // Send the file to the browser for downloading
      res.download(imagePath, file.originalName); // Triggers download with the original file name
    } catch (err) {
      console.error('Error during image download:', err);
      res.status(500).send('Error occurred during image download');
    }
  });
  