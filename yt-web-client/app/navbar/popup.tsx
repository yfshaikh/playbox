'use client'

import { useState } from 'react';
import popup_styles from './popup.module.css'
import upload_styles from './upload.module.css'
import { uploadVideo } from '../firebase/functions';

function Popup({ closePopup, show }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.item(0);
      if (file) {
        handleUpload(file);
      }
    };
  
  
  
    const handleUpload = async (file: File) => {
      try {
        const response = await uploadVideo(file);
        alert(`File uploaded successfully. Server responded with: ${JSON.stringify(response)}`);
      } catch (error) {
        alert(`Failed to upload file: ${error}`);
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
                <input id="upload-video" className={popup_styles.upload_input} type="file" accept="video/*" onChange={handleFileChange} />
                <label htmlFor="upload-video" className={popup_styles.upload_button}>Video</label>
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
