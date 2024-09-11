import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';


const generateUploadUrlFunction = httpsCallable(functions, 'generateUploadUrl');
const getVideosFunction = httpsCallable(functions, 'getVideos');
const getThumbnailFunction = httpsCallable(functions, 'getThumbnail');
const setThumbnailFunction = httpsCallable(functions, 'setThumbnail');


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


export async function uploadVideo(file: File) {
  // Get the signed URL from the server
  const response: any = await generateUploadUrlFunction({
    fileExtension: file.name.split('.').pop(),
    fileType: 'video',
  });
  

  // Upload the file to the signed URL
  const uploadResult = await fetch(response?.data?.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  const { url, fileName, id } = response.data;


  return {uploadResult, id};
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

