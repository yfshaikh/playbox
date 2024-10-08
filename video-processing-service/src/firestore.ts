import { credential } from "firebase-admin";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";

initializeApp({credential: credential.applicationDefault()});

const firestore = new Firestore();

// Note: This requires setting an env variable in Cloud Run
/** if (process.env.NODE_ENV !== 'production') {
  firestore.settings({
      host: "localhost:8080", // Default port for Firestore emulator
      ssl: false
  });
} */


const videoCollectionId = 'videos';
const thumbnailCollectionId = 'thumbnails';

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: 'processing' | 'processed',
  title?: string,
  description?: string,
  thumbnailUrl?: string, // URL of the thumbnail image
}

export interface Thumbnail {
  id?: string,
  uid?: string,
  filename?: string,
  status?: 'processing' | 'processed',
  title?: string,
  description?: string,
}

async function getVideo(videoId: string) {
  const snapshot = await firestore.collection(videoCollectionId).doc(videoId).get();
  return (snapshot.data() as Video) ?? {};
}

async function getThumbnail(thumbnailId: string) {
  const snapshot = await firestore.collection(thumbnailCollectionId).doc(thumbnailId).get();
  return (snapshot.data() as Thumbnail) ?? {};
}

export function setVideo(videoId: string, video: Video) {
  return firestore
    .collection(videoCollectionId)
    .doc(videoId)
    .set(video, { merge: true })
}

export function setThumbnail(thumbnailId: string, thumbnail: Thumbnail) {
  return firestore
    .collection(thumbnailCollectionId)
    .doc(thumbnailId)
    .set(thumbnail, { merge: true })
}

export async function isVideoNew(videoId: string) {
  const video = await getVideo(videoId);
  return video?.status === undefined;
}

export async function isThumbnailNew(thumbnailId: string) {
  const thumbnail = await getThumbnail(thumbnailId);
  return thumbnail?.status === undefined;
}