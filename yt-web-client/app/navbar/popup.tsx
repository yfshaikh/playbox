'use client'

import { useState, useEffect } from 'react';
import popup_styles from './popup.module.css'
import upload_styles from './upload.module.css'
import { uploadVideo } from '../firebase/functions';
import { uploadThumbnail } from '../firebase/functions';
import { setThumbnail } from '../firebase/functions';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/firebase';

function Popup({ closePopup, show }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoId, setVideoId] = useState();
    const [thumbnailId, setThumbnailId] = useState();

    const functions = getFunctions(app); // Get Firebase functions instance
    const callSetThumbnail = httpsCallable(functions, 'setThumbnail'); // Call the Cloud Function

  // UseEffect to call setThumbnail once both videoId and thumbnailId are set
  useEffect(() => {
    if (thumbnailId && videoId) {
      const linkThumbnailToVideo = async () => {
        try {
          // Call the Cloud Function using httpsCallable
          const response = await callSetThumbnail({ thumbnailId, videoId });
          alert(`Thumbnail successfully linked to video.`);
        } catch (error) {
          alert(`Failed to link thumbnail: ${error}`);
        }
      };
      linkThumbnailToVideo();
    }
  }, [thumbnailId, videoId]); // Runs when both thumbnailId and videoId are available

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
      const file = event.target.files?.item(0);
      if (file) {
        handleUpload(file, type);
      }
    };
  
    const handleUpload = async (file: File, type: string) => {
      if(type == 'video'){
        try {
          const response = await uploadVideo(file);
          setVideoId(response.id);
          alert(`Video uploaded successfully. Server responded with: ${JSON.stringify(response)}`);
        } catch (error) {
          alert(`Failed to upload file: ${error}`);
        }
      } else if(type == 'thumbnail'){
        try {
          const response = await uploadThumbnail(file);
          setThumbnailId(response.id);
          alert(`Thumbnail uploaded successfully. Server responded with: ${JSON.stringify(response)}`);
        } catch (error) {
          alert(`Failed to upload file: ${error}`);
        }
      }
    };

    
    
  return (show ?
    (
        <div className={popup_styles.popup_overlay}>
            <div className={popup_styles.popup_content}>
                <button className={popup_styles.close_button} onClick={closePopup}>
                &times;
                </button>
                <h2>Upload video</h2>
                <input id="upload-video" className={popup_styles.upload_input} type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                <label htmlFor="upload-video" className={popup_styles.upload_button}>Video</label>
                <input id="upload-thumbnail" className={popup_styles.upload_input} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'thumbnail')} />
                <label htmlFor="upload-thumbnail" className={popup_styles.upload_button}>Thumbnail</label>
            </div>
        </div>
    ) :
    (
        ""
    )
  )
}

export default Popup;

//<input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
//<textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
