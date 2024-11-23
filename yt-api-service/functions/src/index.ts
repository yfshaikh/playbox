/* eslint-disable */

// entry point for callable firebase functions
// these will be invoked in yt-web-client/.../functions.ts (client)


import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";
import { CallableRequest } from "firebase-functions/v2/https";

// Initialize Firebase Admin
initializeApp();

// Initialize Storage and Firestore instances
const storage = new Storage();
const firestore = new Firestore();

// Bucket names
const rawVideoBucketName = "raw-videos-yt";
const rawThumbnailBucketName = "thumbnail-bucket-yt";


// Cloud Function to generate an upload URL
export const generateUploadUrl = onCall({maxInstances: 1}, async (request) => {
  // Check if the user is authentication
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const auth = request.auth;
  const data = request.data;
  const { fileType, fileExtension } = data; // Expect fileType (video or thumbnail) from the client
  
  let bucketName;
  let fileName;
  let id;

  // Determine if the file is a video or thumbnail and set the appropriate bucket
  if (fileType === "video") {
    bucketName = rawVideoBucketName; // Use the video bucket for videos
    id = `${auth.uid}-${Date.now()}`; // Generate a unique videoId
    fileName = `${auth.uid}-${Date.now()}.${fileExtension}`; // Generate a unique filename for video
  } else if (fileType === "thumbnail") {
    bucketName = rawThumbnailBucketName; // Use the thumbnail bucket for thumbnails
    id = `thumbnail-${auth.uid}-${Date.now()}`; // Generate a unique videoId
    fileName = `thumbnail-${auth.uid}-${Date.now()}.${fileExtension}`; // Generate a unique filename for thumbnail
  } else {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid file type. Must be 'video' or 'thumbnail'."
    );
  }

  const bucket = storage.bucket(bucketName);

  // Get a v4 signed URL for uploading file
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return {url, fileName, id};
}); 

// Cloud Function to handle new user creation
export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo)
    .then(() => {
      logger.info(`User Created: ${JSON.stringify(userInfo)}`);
    })
    .catch((error) => {
      logger.error(`Error creating user: ${error.message}`);
    });

  return null; // Explicitly return null or a promise
});

const videoCollectionId = "videos";

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: "processing" | "processed",
  title?: string,
  description?: string,
  thumbnail?: string,
}

export const getVideos = onCall({maxInstances: 1}, async () => {
  const querySnapshot =
    await firestore.collection(videoCollectionId).limit(10).get();
  return querySnapshot.docs.map((doc) => doc.data());
});



export const getThumbnail = onCall({ maxInstances: 1 }, async (request: CallableRequest<any>) => {
  const { thumbnailId } = request.data; // Access data from the request object

  if (!thumbnailId) {
    throw new functions.https.HttpsError('invalid-argument', 'Thumbnail ID is required');
  }

  const docRef = firestore.collection('thumbnails').doc(thumbnailId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'Thumbnail not found');
  }

  return doc.data(); // Return the thumbnail data
});

export const setThumbnail = onCall({ maxInstances: 1 }, async (request: CallableRequest<any>) => {
  const { videoId, thumbnailId } = request.data;
  console.log(`Received request to update video: ${videoId} with thumbnail: ${thumbnailId}`);

  if (!videoId) {
    console.error('Video ID is missing');
    throw new functions.https.HttpsError('invalid-argument', 'Video ID is required');
  }

  if (!thumbnailId) {
    console.error('Thumbnail ID is missing');
    throw new functions.https.HttpsError('invalid-argument', 'Thumbnail ID is required');
  }

  const docRef = firestore.collection('videos').doc(videoId);

  try {
    console.log(`Fetching document for videoId: ${videoId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.error(`Video with ID ${videoId} not found`);
      throw new functions.https.HttpsError('not-found', 'Video not found');
    }

    console.log(`Document exists for videoId: ${videoId}. Updating with thumbnailId: ${thumbnailId}`);


    // Update the document with the thumbnail ID
    await docRef.update({
      thumbnail: thumbnailId,
    });

    console.log(`Successfully updated video ${videoId} with thumbnail ${thumbnailId}`);


    return { success: true }; // return success status
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    throw new functions.https.HttpsError('internal', 'Error updating thumbnail');
  }
});

export const saveMetadata = onCall({ maxInstances: 1 }, async (request: CallableRequest<any>) => {
  const { videoId, title, description } = request.data;

  // Validate the input
  if (!videoId || !title || !description) {
    logger.error("Missing required fields");
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Video ID, title, and description are required."
    );
  }

  try {
    logger.info(`Saving metadata for video: ${videoId}`);
    // Save metadata to Firestore
    await firestore.collection("videos").doc(videoId).set({
      title,
      description,
    });

    logger.info("Metadata saved successfully");
    return { success: true };
  } catch (error) {
    logger.error("Error saving metadata:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while saving metadata."
    );
  }
});

// fetch video details from Firebase
export const getVideoDetails = onCall({ maxInstances: 1 }, async (request: CallableRequest<any>) => {
  const { videoId } = request.data;

  // Validate the input
  if (!videoId) {
    logger.error("Missing required field: filename");
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Filename is required."
    );
  }

  try {
    logger.info(`Fetching details for video: ${videoId}`);
    const videoDoc = await firestore.collection("videos").doc(videoId).get();

    if (!videoDoc.exists) {
      logger.error(`Video not found: ${videoId}`);
      throw new functions.https.HttpsError(
        "not-found",
        "Video not found."
      );
    }

    logger.info(`Video details found for: ${videoId}`);
    return videoDoc.data();  // Return the video details
  } catch (error) {
    logger.error("Error fetching video details:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while fetching video details."
    );
  }
});





