import { Storage } from "@google-cloud/storage";
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import path from "path";

// Initialize Google Cloud Storage client
const storage = new Storage();


// Define bucket names for raw/processed videos and thumbnails
const rawVideoBucketName = "raw-videos-yt";
const processedVideoBucketName = "processed-videos-yt";
const rawThumbnailBucketName = "thumbnail-bucket-yt";
const processedThumbnailBucketName = "processed-thumbnail-bucket-yt";

// Define local paths for storing raw/processed videos and thumbnails
const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";
const localRawThumbnailPath = "./raw-thumbnails";
const localProcessedThumbnailPath = "./processed-thumbnails";



/**
 * Creates the local directories for raw and processed videos.
 */
export function setupDirectories() {
  ensureDirectoryExistence(localRawVideoPath);
  ensureDirectoryExistence(localProcessedVideoPath);
  ensureDirectoryExistence(localRawThumbnailPath);
  ensureDirectoryExistence(localProcessedThumbnailPath);
}

/**
 * Converts a video file from raw format to processed MP4 format.
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The base name of the processed file (without resolution).
 * @param height - The target resolution height (e.g., 360, 720).
 * @returns A promise that resolves when the video has been converted to the specified resolution.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string, height: number) {
  return new Promise<void>((resolve, reject) => {
    const outputFileName = processedVideoName.endsWith(".mp4")
      ? processedVideoName
      : `${processedVideoName.split(".")[0]}.mp4`;

    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
      .outputOptions("-vf", `scale=-1:${height}`) // Scale to dynamic height
      .outputOptions("-c:v", "libx264")
      .outputOptions("-preset", "fast")
      .outputOptions("-crf", "23")
      .outputOptions("-c:a", "aac")
      .on("end", () => resolve())
      .on("error", (err: any) => reject(err))
      .save(`${localProcessedVideoPath}/${outputFileName}`);
  });
}





/**
 * Downloads a raw video file from the specified Cloud Storage bucket.
 * @param fileName - The name of the file to download from the 
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 */
export async function downloadRawVideo(fileName: string) {
  await storage.bucket(rawVideoBucketName)
    .file(fileName)
    .download({
      destination: `${localRawVideoPath}/${fileName}`, // Save to local raw video path
    });

  console.log(
    `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
  );
}


/**
 * Uploads a processed video file to the specified Cloud Storage bucket.
 * @param fileName - The name of the file to upload from the 
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolves when the file has been uploaded.
 */
export async function uploadProcessedVideo(fileName: string) {
  const bucket = storage.bucket(processedVideoBucketName);
  const outputFileName = fileName.endsWith('.mp4') ? fileName : `${fileName.split(".")[0]}.mp4`;

   // Upload the video to the processed video bucket
  await storage.bucket(processedVideoBucketName)
    .upload(`${localProcessedVideoPath}/${outputFileName}`, {
      destination: outputFileName,
    });
  console.log(
    `${localProcessedVideoPath}/${outputFileName} uploaded to gs://${processedVideoBucketName}/${outputFileName}.`
  );

  // Set the video to be publicly readable
  await bucket.file(outputFileName).makePublic();
}


/**
 * @param fileName - The name of the file to delete from the
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 * 
 */
export function deleteRawVideo(fileName: string) {
  return deleteFile(`${localRawVideoPath}/${fileName}`);
}


/**
* Deletes a processed video file from the local storage.
* @param fileName - The name of the file to delete from the
* {@link localProcessedVideoPath} folder.
* @returns A promise that resolves when the file has been deleted.
* 
*/
export function deleteProcessedVideo(fileName: string) {
  const outputFileName = fileName.endsWith('.mp4') ? fileName : `${fileName.split(".")[0]}.mp4`;
  return deleteFile(`${localProcessedVideoPath}/${outputFileName}`);
}


/**
 * Deletes a file from the specified file path.
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when the file has been deleted.
 */
function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) { // Check if file exists
      fs.unlink(filePath, (err) => { // Delete the file
        if (err) { 
          console.error(`Failed to delete file at ${filePath}`, err);
          reject(err); // Reject if error occurs during deletion
        } else {
          console.log(`File deleted at ${filePath}`);
          resolve(); // Resolve if file is successfully deleted
        }
      });
    } else {
      console.log(`File not found at ${filePath}, skipping delete.`);
      resolve(); // Resolve if file doesn't exist, no deletion needed
    }
  });
}



/*
 *
 *
 * THUMBNAILS
 * 
 * 
 * /
 
/**
 * Downloads a thumbnail from the specified Cloud Storage bucket.
 * @param fileName - The name of the file to download from the 
 * {@link thumbnailBucketName} bucket into the {@link localThumbnailPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 */
export async function downloadThumbnail(fileName: string) {
  
  await storage.bucket(rawThumbnailBucketName)
    .file(fileName)
    .download({
      destination: `${localRawThumbnailPath}/${fileName}`, // Save to local raw thumbnail path
    });

  console.log(
    `gs://${rawThumbnailBucketName}/${fileName} downloaded to ${localRawThumbnailPath}/${fileName}.`
  );
  
}



/**
 * Converts an image to a thumbnail (resized).
 * @param inputImageName - The name of the original image.
 * @param outputImageName - The name of the thumbnail to be created.
 * @returns A promise that resolves when the thumbnail is created.
 */
export async function createThumbnail(inputImageName: string, outputImageName: string) {
  const inputPath = path.join(localRawThumbnailPath, inputImageName);
  const outputPath = path.join(localProcessedThumbnailPath, outputImageName);

  return sharp(inputPath)
    .resize(200, 200) // Resize to thumbnail size
    .toFile(outputPath)
    .then(() => {
      console.log('Thumbnail created successfully');
    })
    .catch((err) => {
      console.error('Error creating thumbnail:', err.message);
      throw err;
    });
}


/**
 * Uploads a thumbnail file to the Cloud Storage bucket.
 * @param fileName - The name of the thumbnail to upload.
 * @returns A promise that resolves when the file is uploaded.
 */
export async function uploadThumbnail(fileName: string) {

  const bucket = storage.bucket(processedThumbnailBucketName);

  // Upload the thumbnail to the bucket
  await storage.bucket(processedThumbnailBucketName)
  .upload(`${localProcessedThumbnailPath}/${fileName}`, {
    destination: fileName,
  });
  console.log(
  `${localProcessedThumbnailPath}/${fileName} uploaded to gs://${processedThumbnailBucketName}/${fileName}.`
);

  // Make the thumbnail publicly accessible
  await bucket.file(fileName).makePublic();
}




/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check.
 */
function ensureDirectoryExistence(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true }); // recursive: true enables creating nested directories
    console.log(`Directory created at ${dirPath}`);
  }
}
