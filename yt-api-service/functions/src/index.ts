/* eslint-disable */


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
const thumbnailBucketName = "thumbnail-bucket-yt";


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

  // Determine if the file is a video or thumbnail and set the appropriate bucket
  if (fileType === "video") {
    bucketName = rawVideoBucketName; // Use the video bucket for videos
    fileName = `${auth.uid}-${Date.now()}.${fileExtension}`; // Generate a unique filename for video
  } else if (fileType === "thumbnail") {
    bucketName = thumbnailBucketName; // Use the thumbnail bucket for thumbnails
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

  return {url, fileName};
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


