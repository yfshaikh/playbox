'use client';

import { useSearchParams } from 'next/navigation'
import React from 'react'
import styles from './watch.module.css';
import { Container } from "@material-ui/core";
import Video from 'next-video';




export default function Watch() {
  const videoPrefix = 'https://storage.googleapis.com/processed-videos-yt/';
  const fileName = useSearchParams().get('v');
  const videoSrc = fileName?.endsWith('.mp4') ? fileName : `${fileName?.split(".")[0]}.mp4`;
  console.log(videoPrefix+videoSrc)

  




  return (
    <>
      <div className={styles.video_container}>
        <Container maxWidth='md'>
          <Video src={videoPrefix+videoSrc} accentColor='blue' />
        </Container>
    </div>
  </>
  );
}

