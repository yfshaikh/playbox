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

// Process a video file from Cloud Storage into multiple resolutions (360p and 720p)
app.post('/process-video', async (req, res) => {
  let data;

  try {
    // Decode and parse the Cloud Pub/Sub message
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
    data = JSON.parse(message);

    if (!data.name) {
      throw new Error('Invalid message payload received.');
    }
  } catch (error) {
    console.error('Error decoding Pub/Sub message:', error);
    return res.status(400).send('Bad Request: missing filename.');
  }

  const inputFileName = data.name; // Raw video file name
  const baseOutputFileName = `processed-${inputFileName.split('.')[0]}`; // Base name for processed files
  const videoId = inputFileName.split('.')[0];

  // Define resolutions to process
  const resolutions = [
    { height: 360, suffix: '_360p' },
    { height: 720, suffix: '_720p' },
  ];

  // Check if the video is already being processed or processed
  console.log(`CHECKING IF VIDEO WITH ID ${videoId} IS ALREADY PROCESSING `)
  if (!isVideoNew(videoId)) {
    return res.status(400).send('Bad Request: video already processing or processed.');
  } else {
    // Update database: Mark video as processing
    console.log(`${videoId} IS NOT PROCESSING, GOING TO START PROCESSING. STATUS SET TO PROCESSING`)
    await setVideo(videoId, {
      id: videoId,
      uid: videoId.split('-')[0],
      status: 'processing',
    });

    // Download the raw video file from Cloud Storage
    console.log(`CALLED DOWNLOADRAWVIDEO ON ${inputFileName}`)
    await downloadRawVideo(inputFileName);
  }

  try {


    // Process the video for each resolution concurrently
    const processedFiles = await Promise.all(
      resolutions.map(async ({ height, suffix }) => {
        const outputFileName = `${baseOutputFileName}${suffix}.mp4`;
        await convertVideo(inputFileName, outputFileName, height);
        await uploadProcessedVideo(outputFileName);
        return { resolution: `${height}p`, filename: outputFileName };
      })
    );

    console.log(`SET VIDEO WITH ID ${videoId} TO PROCESSED`)
    // Update the database: Mark video as processed and include file details
    await setVideo(videoId, {
      status: 'processed',
      files: processedFiles, // Include details of processed files
    });

    // Delete the raw video file after processing
    await Promise.all([
      deleteRawVideo(inputFileName),
      resolutions.map(async ({ height, suffix }) => {
        const outputFileName = `${baseOutputFileName}${suffix}.mp4`;
        await deleteProcessedVideo(outputFileName);
      })
    ]);


    console.log('Video processing completed successfully');
    return res.status(200).send('Processing finished successfully');
  } catch (error: any) {
    console.error('Error during video processing:', error);

    // Cleanup: Delete raw and any partially processed videos
    await Promise.all([
      deleteRawVideo(inputFileName),
      ...resolutions.map(({ suffix }) => deleteProcessedVideo(`${baseOutputFileName}${suffix}.mp4`)),
    ]);

    return res.status(500).send('Processing failed: ' + error.message);
  }
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



