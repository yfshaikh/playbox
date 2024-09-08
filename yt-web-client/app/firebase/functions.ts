import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';


const generateUploadUrlFunction = httpsCallable(functions, 'generateUploadUrl');
const getVideosFunction = httpsCallable(functions, 'getVideos');

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: 'processing' | 'processed',
  title?: string,
  description?: string,  
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


  return uploadResult;
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

  return uploadResult;
}


export async function getVideos() {
  const response: any = await getVideosFunction();
  return response.data as Video[];
}