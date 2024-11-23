'use client';

import { useSearchParams } from 'next/navigation'
import React from 'react'
import styles from './watch.module.css';
import { Container } from "@material-ui/core";
import Video from 'next-video';
import { fetchVideoDetails } from '../firebase/functions'
import { useEffect, useState } from 'react';
import Player from 'next-video/player';

interface VideoDetails {
  title: string;
  description: string;
}


export default function Watch() {
  const videoPrefix = 'https://storage.googleapis.com/processed-videos-yt/';
  const fileName = useSearchParams().get('v');
  const videoId = fileName?.split('processed-')[1]?.split('.mov')[0];
  const videoSrc = fileName?.endsWith('.mp4') ? fileName : `${fileName?.split(".")[0]}.mp4`;
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);



  
  useEffect(() => {
    if (videoId) {
      const fetchDetails = async () => {
        try {

          let response = {} as VideoDetails
          response = await fetchVideoDetails(videoId) as VideoDetails;

          // Ensure the response has the correct structure before setting it
          if (response && response.title && response.description) {
            setVideoDetails(response);
          } else {
            setVideoDetails({ title: 'Unknown Title', description: 'Description not available' });
          }
        } catch (error) {
          console.error('Failed to fetch video details:', error);
          setVideoDetails({ title: 'Error', description: 'Failed to load video details' });
        }
      };

      fetchDetails();
    }
  }, [videoId]);




  return (
    <>
    {videoSrc &&
    <div className={styles.video_container}>
      <Container maxWidth="md">
      {videoDetails && (
          <h1 className={styles.video_title}>{videoDetails.title}</h1>
        )}
        <Player src={`${videoPrefix}${videoSrc}`} accentColor="blue" />

        {videoDetails && (
          <div className={styles.video_details}>
            <p className={styles.video_description}>{videoDetails.description}</p>
          </div>
        )}
      </Container>
    </div>
    }
  </>
  );
}

