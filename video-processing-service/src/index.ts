import express from 'express';
import { isThumbnailNew, isVideoNew, setThumbnail, setVideo } from "./firestore";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

import { 
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  convertVideo,
  createThumbnail,
  uploadThumbnail,
  setupDirectories,
  downloadThumbnail
} from './storage';
import { platform } from 'os';

// Create the local directories for videos if they don't already exist
setupDirectories();

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies in incoming requests

// Allow requests from localhost:3000
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));


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
      status: 'processing',
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
  console.log(`inputFileName: ${inputFileName}`)
  const outputFileName = `processed-${inputFileName}`; // Name of the thumbnail file
  console.log(`outputFileName: ${outputFileName}`)
  const thumbnailId = inputFileName.split('.')[0];


  try {


    // raw thumbnail is uploaded to cloud bucket by user
    
    
    // Download the thumbnail from the raw bucket and save it to localRawThumbnailPath/inputFileName
    await downloadThumbnail(inputFileName);


    // get the thumbnail from local folder and resize, then save it to output folder
    await createThumbnail(inputFileName, outputFileName);

    // upload output/processed thumbnail to the processed bucket
    await uploadThumbnail(outputFileName); 
    

    if (!isThumbnailNew(thumbnailId)) {
      return res.status(400).send('Bad Request: thumbnail already processing or processed.');
    } else {
      await setThumbnail(thumbnailId, {
        id: thumbnailId,
        uid: thumbnailId.split('-')[0],
        status: 'processing'
      });
    }


    await setThumbnail(thumbnailId, {
      status: 'processed',
      filename: outputFileName
    });


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










const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



