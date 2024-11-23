// invoke callable function from yt-api-service to use in the client

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';


const generateUploadUrlFunction = httpsCallable(functions, 'generateUploadUrl');
const getVideosFunction = httpsCallable(functions, 'getVideos');
const getThumbnailFunction = httpsCallable(functions, 'getThumbnail');
const setThumbnailFunction = httpsCallable(functions, 'setThumbnail');
const saveMetadata = httpsCallable(functions, "saveMetadata");
const getVideoDetails = httpsCallable(functions, "getVideoDetails");

 
 
export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: 'processing' | 'processed',
  title?: string,
  description?: string,  
  thumbnail?: string,
}

export interface Thumbnail {
  id?: string,
  uid?: string,
  filename?: string,
  status?: 'processing' | 'processed',
  title?: string,
  description?: string,  
  video?: string,
}

interface VideoDetails {
  title: string;
  description: string;
}


export async function uploadVideo(file: File, title: string, description: string) {
  // 1. Get the signed URL from the server
  const response: any = await generateUploadUrlFunction({
    fileExtension: file.name.split('.').pop(),
    fileType: 'video',
  });
  

  // 2. Upload the file to the signed URL
  const uploadResult = await fetch(response?.data?.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  // const { url, fileName, id } = response.data;
  const { id } = response.data;

  // 3: Call the saveMetadata function with the video ID, title, and description
  try {
    const metadataResult = await saveMetadata({
      videoId: id,
      title,
      description,
    });

    console.log("Metadata saved successfully:", metadataResult.data);
  } catch (error) {
    console.error("Error saving metadata:", error);
    throw error; // Re-throw to allow the caller to handle it
  }



  return { uploadResult, id };
}

export async function uploadThumbnail(file: File) {
  // Get the signed URL for uploading the thumbnail from the server
  const response: any = await generateUploadUrlFunction({
    fileExtension: file.name.split('.').pop(),
    fileType: 'thumbnail', // Specify 'thumbnail' to indicate this is a thumbnail upload
  });

  // Upload the thumbnail to the signed URL
  const uploadResult = await fetch(response?.data?.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  const { url, fileName, id } = response.data;


  return {uploadResult, fileName, id, url};
}




export async function getVideos() {
  const response: any = await getVideosFunction();
  console.log('videos response: ', response.data as Video[])
  return response.data as Video[];
}

export async function getThumbnail(thumbnailId) {
  const response: any = await getThumbnailFunction(thumbnailId);
  return response.data as Thumbnail;
}

export async function setThumbnail(thumbnailId: string, videoId: string) {
  try {
    const result = await setThumbnailFunction({ thumbnailId, videoId });
    console.log(`=========setThumbnail called with ${thumbnailId} and ${videoId}============`)
    console.log('Thumbnail set successfully:', result.data);
  } catch (error) {
    console.error('Error setting thumbnail:', error);
  }
}

// Function to get video details by calling the Firebase callable function
export const fetchVideoDetails = async (videoId: string) => {
  try {
    // Call the Firebase callable function to fetch video details
    const response = await getVideoDetails({ videoId });

    // Check if the response contains data
    const videoDetails = response.data;

    if (videoDetails) {
      console.log("Video details:", videoDetails);
      return videoDetails; // Return the video details (title, description, etc.)
    } else {
      // If no video details found, log a message and return null
      console.log("Video not found.");
      return null;
    }
  } catch (error: unknown) {
    // Type assertion to 'any' or 'HttpsError' to access properties safely
    if (error instanceof Error) {
      // Handle standard errors (e.g., network issues)
      console.error("Error fetching video details:", error.message);
    } else {
      // If the error is not an instance of Error, log the unknown error
      console.error("An unknown error occurred while fetching video details.");
    }

    // Check if the error is a Firebase HttpsError
    if ((error as { code?: string; message?: string }).code) {
      const firebaseError = error as { code: string; message: string };
      console.error(`Error Code: ${firebaseError.code} - ${firebaseError.message}`);
    }

    // Throw a more descriptive error
    throw new Error("Failed to fetch video details. Please try again later.");
  }
};









