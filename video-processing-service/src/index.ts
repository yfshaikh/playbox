import express from 'express';
import { isVideoNew, setVideo } from "./firestore";
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import { 
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  convertVideo,
  createThumbnail,
  uploadThumbnail,
  setupDirectories
} from './storage';
import { platform } from 'os';

// Create the local directories for videos if they don't already exist
setupDirectories();

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies in incoming requests


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Temporary directory for storing the uploaded file
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Rename the file with the current timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Process a video file from Cloud Storage into 360p
app.post('/process-video', async (req, res) => {

  // Get the bucket and filename from the Cloud Pub/Sub message
  let data;
  try {
    // Cloud Pub/Sub sends messages in base64, decode and parse to JSON
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
    data = JSON.parse(message);

    // Check if required fields are present
    if (!data.name) {
      throw new Error('Invalid message payload received.');
    }
  } catch (error) {
    console.error(error); 
    return res.status(400).send('Bad Request: missing filename.');
  }

  // Define the input and output filenames based on the message
  const inputFileName = data.name; // Name of the raw video file
  const outputFileName = `processed-${inputFileName}`; // Name of the processed video file
  const videoId = inputFileName.split('.')[0];

  if (!isVideoNew(videoId)) {
    return res.status(400).send('Bad Request: video already processing or processed.');
  } else {
    await setVideo(videoId, {
      id: videoId,
      uid: videoId.split('-')[0],
      status: 'processing'
    });
  }

  // Download the raw video from Cloud Storage
  await downloadRawVideo(inputFileName);

  // Process the video into 360p
  try { 
    await convertVideo(inputFileName, outputFileName)
  } catch (err: any) {
    // If processing fails, clean up by deleting both raw and processed videos
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName)
    ]);
    return res.status(500).send('Processing failed' + err.message);
  }
  
  // Upload the processed video to Cloud Storage
  await uploadProcessedVideo(outputFileName);

  await setVideo(videoId, {
    status: 'processed',
    filename: outputFileName
  });

  // If processing fails, clean up by deleting both raw and processed videos
  await Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(outputFileName)
  ]);

  return res.status(200).send('Processing finished successfully');
});


// Define the process-thumbnail endpoint
app.post('/process-thumbnail', async (req, res) => {
  console.log('Request body:', req.body);
  let data;
  try {
    // Cloud Pub/Sub sends messages in base64, decode and parse to JSON
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
    data = JSON.parse(message);

    // Check if required fields are present
    if (!data.name) {
      throw new Error('Invalid message payload received.');
    }
  } catch (error) {
    console.error(error);
    return res.status(400).send('Bad Request: missing image filename.');
  }

  const inputFileName = data.name; // Name of the original image file
  const outputFileName = `thumbnail-${inputFileName}`; // Name of the thumbnail file
  const imageId = inputFileName.split('.')[0];


  try {

    // Create the thumbnail using the createThumbnail function
    await createThumbnail(inputFileName, outputFileName);

    // Upload the thumbnail to Cloud Storage
    await uploadThumbnail(outputFileName);

    /*
    // Update the image status to processed (simulated here)
    await setImage(imageId, {
      status: 'processed',
      filename: outputFileName,
    });
    */

    /*
    // delete local files after processing
    await deleteFile(`${localThumbnailPath}/${inputFileName}`);
    await deleteFile(`${localThumbnailPath}/${outputFileName}`);
    */

    return res.status(200).send('Thumbnail processed and uploaded successfully.');
  } catch (err: any) {
    console.error('Error processing thumbnail:', err.message);
    return res.status(500).send('Thumbnail processing failed: ' + err.message);
  }
});







const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



