'use client'

import { useState, useEffect } from 'react';
import { uploadVideo, uploadThumbnail, setThumbnail } from '../firebase/functions';

function Popup({ closePopup, show }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [thumbnailId, setThumbnailId] = useState(null);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [thumbnailUploaded, setThumbnailUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFileName, setVideoFileName] = useState('');
  const [thumbnailFileName, setThumbnailFileName] = useState('');

  // When video or thumbnail files are changed, update the state variables
  const handleFileChange = (event, type) => {
    const file = event.target.files?.item(0);
    if (file) {
      if (type === 'video') {
        setVideoFile(file);
        setVideoFileName(file.name);
      } else if (type === 'thumbnail') {
        setThumbnailFile(file);
        setThumbnailFileName(file.name);
      }
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title || !description || !videoFile || !thumbnailFile) {
      alert("Please fill in all fields and upload both the video and thumbnail.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload video and thumbnail when submit is clicked
      await handleUploadVideo(videoFile, title, description);
      await handleUploadThumbnail(thumbnailFile);

      console.log('video id', videoId);
      console.log('thumbnail id', thumbnailId);

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
          await setThumbnail(thumbnailId, videoId);
          alert('Thumbnail successfully linked to video.');
        } catch (error) {
          console.error('Failed to link thumbnail:', error);
        }
      };

      linkThumbnail();
    }
  }, [videoId, thumbnailId]);

  // Call firebase function to upload video to GCP
  const handleUploadVideo = async (file, title, description) => {
    if (file) {
      try {
        const response = await uploadVideo(file, title, description);
        setVideoId(response.id);
        setVideoUploaded(true);
        alert(`Video uploaded successfully.`);
        console.log('video upload response:', response);
      } catch (error) {
        alert(`Failed to upload video: ${error}`);
      }
    }
  };

  // Call firebase function to upload thumbnail to GCP
  const handleUploadThumbnail = async (file) => {
    if (file) {
      try {
        const response = await uploadThumbnail(file);
        setThumbnailId(response.id);
        setThumbnailUploaded(true);
        alert(`Thumbnail uploaded successfully.`);
        console.log('thumbnail upload response:', response);
      } catch (error) {
        alert(`Failed to upload thumbnail: ${error}`);
      }
    }
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen flex justify-center items-center z-50 bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Upload Video</h2>
          <button 
            onClick={closePopup}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Upload Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Video Upload */}
            <div>
              <input
                id="upload-video"
                className="hidden"
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'video')}
              />
              <label 
                htmlFor="upload-video" 
                className="group flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-gray-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
                  </svg>
                  <p className="text-xs text-gray-500 text-center">
                    {videoFileName || "Upload Video"}
                  </p>
                </div>
              </label>
              {videoFile && (
                <p className="mt-1 text-xs text-green-600 text-center">Video selected</p>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <input
                id="upload-thumbnail"
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'thumbnail')}
              />
              <label 
                htmlFor="upload-thumbnail" 
                className="group flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-gray-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-gray-500 text-center">
                    {thumbnailFileName || "Upload Thumbnail"}
                  </p>
                </div>
              </label>
              {thumbnailFile && (
                <p className="mt-1 text-xs text-green-600 text-center">Thumbnail selected</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!videoFile || !thumbnailFile || isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Popup;