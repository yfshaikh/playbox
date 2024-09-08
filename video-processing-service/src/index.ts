import express from 'express';
import { isVideoNew, setVideo } from "./firestore";

import { 
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  convertVideo,
  setupDirectories
} from './storage';
import { platform } from 'os';

// Create the local directories for videos if they don't already exist
setupDirectories();

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies in incoming requests

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



