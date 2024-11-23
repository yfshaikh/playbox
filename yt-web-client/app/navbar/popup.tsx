'use client'

import { useState, useEffect } from 'react';
import styles from './Popup.module.css'; // Import the CSS module
import { uploadVideo } from '../firebase/functions';
import { uploadThumbnail } from '../firebase/functions';
import { setThumbnail } from '../firebase/functions';
import { desc } from 'next-video/dist/cli/init.js';


function Popup({ closePopup, show }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null); // Store the video file
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null); // Store the thumbnail file
  const [videoId, setVideoId] = useState<string | null>(null);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [videoUploaded, setVideoUploaded] = useState(false); // To track if the video has been uploaded
  const [thumbnailUploaded, setThumbnailUploaded] = useState(false); // To track if the thumbnail has been uploaded
  const [isSubmitting, setIsSubmitting] = useState(false); // To prevent multiple submissions


  // 1. when video or thumbnail files are changed, update the state variables, but don't call GCP function yet 
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.item(0);
    if (file) {
      if (type === 'video') {
        setVideoFile(file); // Store video file in state
      } else if (type === 'thumbnail') {
        setThumbnailFile(file); // Store thumbnail file in state
      }
    }
  };


  // 2. When the submit button is clicked, call:
  // handleUploadVideo: use GCP function to upload video, title, and description
  // handleUploadThumbnail: use GCP function to upload thumbnail
  // then call setThumbnail to link the video and thumbnail
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    if (!title || !description || !videoFile || !thumbnailFile) {
      alert("Please fill in all fields and upload both the video and thumbnail.");
      return;
    }

    setIsSubmitting(true);

    try {

      
      // Upload video and thumbnail when submit is clicked
      await handleUploadVideo(videoFile, title, description);
      await handleUploadThumbnail(thumbnailFile);

      console.log('video id', videoId)
      console.log('thumbnail id', thumbnailId)


      // Submit all the data
      /* 
      const videoData = { title, description, videoId, thumbnailId };
      console.log('submitting video data: ', videoData)
      await submitVideoData(videoData);
      */

      closePopup();
    } catch (error) {
      alert(`Failed to submit: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // useEffect to call setThumbnail when both videoId and thumbnailId are available
  useEffect(() => {
    if (videoId && thumbnailId) {
      const linkThumbnail = async () => {
        try {
          await setThumbnail(thumbnailId, videoId); // Link the thumbnail to the video
          alert('Thumbnail successfully linked to video.');
        } catch (error) {
          console.error('Failed to link thumbnail:', error);
        }
      };

      linkThumbnail();
    }
  }, [videoId, thumbnailId]); 


  // call firebase function to upload thumbnail to GCP
  const handleUploadVideo = async (file: File, title: string, description: string) => {
    if (file) {
      try {
        const response = await uploadVideo(file, title, description);
        setVideoId(response.id);
        setVideoUploaded(true); // Mark video as uploaded
        alert(`Video uploaded successfully.`);
        console.log('video upload response:', response)
      } catch (error) {
        alert(`Failed to upload video: ${error}`);
      }
  }
};

  // call firebase function to upload thumbnail to GCP
  const handleUploadThumbnail = async (file: File) => {
    if (file) {
      try {
        const response = await uploadThumbnail(file);
        setThumbnailId(response.id);
        setThumbnailUploaded(true); // Mark thumbnail as uploaded
        alert(`Thumbnail uploaded successfully.`);
        console.log('thumbnail upload response:', response)
      } catch (error) {
        alert(`Failed to upload thumbnail: ${error}`);
      }
    }
  };


  
  const submitVideoData = async (videoData: { title: string, description: string, videoId: string, thumbnailId: string }) => {
    // Handle the submission to Firebase here
    console.log("Submitting data: ", videoData);
  };

  return show ? (
    <div className={styles.popup_overlay}>
      <div className={styles.popup_content}>
        <button className={styles.close_button} onClick={closePopup}>
          &times;
        </button>
        <h2 className={styles.popup_title}>Upload Video</h2>

        {/* Input fields for title and description */}
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className={styles.input}
            required
          />
        </div>

        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className={styles.textarea}
            required
          />
        </div>

        {/* Show both video and thumbnail upload buttons at the same time */}
        <div className={styles.btn_container}>
          <input
            id="upload-video"
            className={styles.upload_input}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, 'video')}
          />
          <label htmlFor="upload-video" className={styles.upload_button}>
            Upload Video
          </label>
        </div>

        <div className={styles.btn_container}>
          <input
            id="upload-thumbnail"
            className={styles.upload_input}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'thumbnail')}
          />
          <label htmlFor="upload-thumbnail" className={styles.upload_button}>
            Upload Thumbnail
          </label>
        </div>

        {/* Submit button */}
        {videoFile && thumbnailFile && (
          <button
            className={styles.submit_button}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  ) : null;
}

export default Popup;
