import { Storage } from "@google-cloud/storage";
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

// Initialize Google Cloud Storage client
const storage = new Storage();


// Define bucket names for raw/processed videos and thumbnails
const rawVideoBucketName = "raw-videos-yt";
const processedVideoBucketName = "processed-videos-yt";
const thumbnailBucketName = "thumbnail-bucket-yt";

// Define local paths for storing raw/processed videos and thumbnails
const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";
const localThumbnailPath = "./thumbnails";


/**
 * Creates the local directories for raw and processed videos.
 */
export function setupDirectories() {
  ensureDirectoryExistence(localRawVideoPath);
  ensureDirectoryExistence(localProcessedVideoPath);
  ensureDirectoryExistence(localThumbnailPath);
}


/**
 * Converts a video file from raw format to a processed 360p format.
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
      .outputOptions("-vf", "scale=-1:360") // video filter, scale to 360p
      .on("end", function () { // when completed successfully
        console.log("Processing finished successfully");
        resolve(); // Resolve the promise
      })
      .on("error", function (err: any) { // when error
        console.log("An error occurred: " + err.message);
        reject(err); // Reject the promise with the error
      })
      .save(`${localProcessedVideoPath}/${processedVideoName}`); // Save processed video to local path
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

   // Upload the video to the processed video bucket
  await storage.bucket(processedVideoBucketName)
    .upload(`${localProcessedVideoPath}/${fileName}`, {
      destination: fileName,
    });
  console.log(
    `${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`
  );

  // Set the video to be publicly readable
  await bucket.file(fileName).makePublic();
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
  return deleteFile(`${localProcessedVideoPath}/${fileName}`);
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
