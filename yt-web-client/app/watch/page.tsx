'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import Player from 'next-video/player';
import { fetchVideoDetails } from '../firebase/functions';

interface VideoDetails {
  title: string;
  description: string;
}

function VideoContent() {
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [resolution, setResolution] = useState('360p');
  const [isLoading, setIsLoading] = useState(true);
  
  const videoPrefix = 'https://storage.googleapis.com/processed-videos-yt/';
  const fileName = useSearchParams().get('v');
  const videoId = fileName?.split('processed-')[1]?.split('.mov')[0].split('_720p.mp4')[0];
  const [videoUrl, setVideoUrl] = useState(`${videoPrefix}processed-${videoId}_${resolution}.mp4`);

  // Update the video URL whenever the resolution changes
  useEffect(() => {
    if (videoId) {
      const updatedVideoUrl = `${videoPrefix}processed-${videoId}_${resolution}.mp4`;
      setVideoUrl(updatedVideoUrl);
    }
  }, [resolution, videoId]);
  
  useEffect(() => {
    if (videoId) {
      const fetchDetails = async () => {
        setIsLoading(true);
        try {
          const response = await fetchVideoDetails(videoId) as VideoDetails;

          if (response && response.title && response.description) {
            setVideoDetails(response);
          } else {
            setVideoDetails({ title: 'Unknown Title', description: 'Description not available' });
          }
        } catch (error) {
          console.error('Failed to fetch video details:', error);
          setVideoDetails({ title: 'Error', description: 'Failed to load video details' });
        } finally {
          setIsLoading(false);
        }
      };

      fetchDetails();
    }
  }, [videoId]);

  return (
    <>
      {videoUrl && (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
          <div className="max-w-4xl mx-auto px-4">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-3/4 mb-6"></div>
                <div className="aspect-video rounded-lg bg-gray-700 mb-6"></div>
              </div>
            ) : (
              <>
                {videoDetails && (
                  <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    {videoDetails.title}
                  </h1>
                )}
                
                <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-800 border border-gray-700">
                  <div className="aspect-video">
                    <Player 
                      src={videoUrl} 
                      accentColor="#8B5CF6" 
                    />
                  </div>
                </div>

                {/* Resolution selector */}
                <div className="flex justify-center space-x-4 my-6">
                  <button
                    className={`px-6 py-2 rounded-full font-medium transition duration-300 ${
                      resolution === '360p'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    }`}
                    onClick={() => setResolution('360p')}
                  >
                    360p
                  </button>
                  <button
                    className={`px-6 py-2 rounded-full font-medium transition duration-300 ${
                      resolution === '720p'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    }`}
                    onClick={() => setResolution('720p')}
                  >
                    720p
                  </button>
                </div>

                {/* Video details */}
                {videoDetails && (
                  <div className="mt-6 p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-100 mb-2">Description</h2>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {videoDetails.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function Watch() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-300">Loading video...</p>
        </div>
      </div>
    }>
      <VideoContent />
    </Suspense>
  );
}