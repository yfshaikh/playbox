'use client';

import { useSearchParams } from 'next/navigation'
import React from 'react'
import ReactPlayer from 'react-player'
import styles from './watch.module.css';
import { Container } from "@material-ui/core";
import Control from './control';
import { useState, useRef } from 'react';
import { formatTime } from './format';



export default function Watch() {
  const videoPrefix = 'https://storage.googleapis.com/processed-videos-yt/';
  const videoSrc = useSearchParams().get('v');
  const [videoState, setVideoState] = useState({
    playing: true,
    muted: false,
    volume: 0.5,
    played: 0,
    seeking: false,
    Buffer : true
  });
  //Destructuring the properties from the videoState
  const {playing, muted, volume, played, seeking} = videoState

  // Explicitly typing the ref as ReactPlayer
  const videoPlayerRef = useRef<ReactPlayer | null>(null);

  const currentTime = videoPlayerRef.current ? videoPlayerRef.current.getCurrentTime() : "00:00";
  const duration = videoPlayerRef.current ? videoPlayerRef.current.getDuration() : "00:00";

  const formatCurrentTime = formatTime(currentTime)
  const formatDuration = formatTime(duration)

  const controlRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);

  const playPauseHandler = () => {
    //plays and pause the video (toggling)
      setVideoState({ ...videoState, playing: !videoState.playing });
  };

  const rewindHandler = () => {
    //Rewinds the video player reducing 5
    videoPlayerRef.current?.seekTo(videoPlayerRef.current.getCurrentTime() - 5);
  };
  const fastFowardHandler = () => {
    //FastFowards the video player by adding 10
    videoPlayerRef.current?.seekTo(videoPlayerRef.current.getCurrentTime() + 10);
  };

  const progressHandler = (state) => {
    if (countRef.current > 3) {
        console.log('count > 3')
        if (controlRef.current) {
            controlRef.current.style.visibility = "hidden";
            console.log('hidden')
        }
    } else if (controlRef.current && controlRef.current.style.visibility === "visible") {
        countRef.current += 1;
        console.log('count++')
    }

    if (!seeking) {
        setVideoState({ ...videoState, ...state });
        //setVideoState({ ...videoState, played: state.played });
    }
};

  const seekHandler = (e, value) => {
    const newPlayed = parseFloat(value) / 100; // Convert value to fraction (0 to 1)
    setVideoState({ ...videoState, played: newPlayed });
    console.log("Seek Value:", newPlayed); // Debugging line
  };
 
  const seekMouseUpHandler = (e, value ) => {
    const seekToValue = parseFloat(value) / 100; // Convert value to fraction (0 to 1)
    setVideoState({ ...videoState, seeking: false });
    videoPlayerRef.current?.seekTo(seekToValue);
    console.log("Seeked to:", seekToValue); // Debugging line
  };

  const onSeekMouseDownHandler = () => {
    setVideoState({ ...videoState, seeking: true });
  };

  const volumeChangeHandler = (e, value) => {
    const newVolume = parseFloat(value) / 100;
      setVideoState({
        ...videoState,
        volume: newVolume,
        muted: Number(newVolume) === 0 ? true : false, // volume === 0 then muted
      })
  };
   
  const volumeSeekUpHandler = (e, value) => {
    const newVolume = parseFloat(value) / 100;
      setVideoState({
        ...videoState,
        volume: newVolume,
        muted: newVolume === 0 ? true : false,
  })};

  const muteHandler = () => {
    //Mutes the video player
    setVideoState({ ...videoState, muted: !videoState.muted });
  };

  const mouseMoveHandler = () => {
    if(controlRef.current) {
      controlRef.current.style.visibility = "visible";
      countRef.current = 0;
    }
  };

  const mouseLeaveHandler = () => {
    if (controlRef.current) {
      controlRef.current.style.visibility = "hidden";
    }
  };



  return (
    <>
      <div className={styles.video_container}>
        <Container maxWidth='md'>
          <div className={styles.player__wrapper} onMouseMove={mouseMoveHandler} onMouseLeave={mouseLeaveHandler} onClick={playPauseHandler}>
          <ReactPlayer
              ref={videoPlayerRef} //updating the react player ref
              className={styles.player}
              url={videoPrefix + videoSrc}
              width="100%"
              height="100%"
              playing={playing}
              volume = {volume}
              muted={muted}
              onProgress = {progressHandler}
            />
          <Control onPlayPause = {playPauseHandler} 
                   controlRef = {controlRef}
                   playing={playing} 
                   onRewind={rewindHandler} 
                   onForward ={fastFowardHandler} 
                   played ={played} 
                   onSeek ={seekHandler} 
                   onSeekMouseUp ={seekMouseUpHandler} 
                   onSeekMouseDown={onSeekMouseDownHandler}
                   volume={volume} 
                   onVolumeChangeHandler = {volumeChangeHandler}
                   onVolumeSeekUp = {volumeSeekUpHandler} 
                   mute = {muted}
                   onMute = {muteHandler} 
                   duration = {formatDuration} 
                   currentTime = {formatCurrentTime} />
        </div>
      </Container>
    </div>
  </>
  );
}

