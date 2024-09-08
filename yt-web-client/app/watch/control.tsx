import React from "react";
import { makeStyles, Slider, withStyles, Button,  Tooltip,  Popover,Grid

} from "@material-ui/core";
import {
 FastForward,
 FastRewind,
 Pause,
 PlayArrow,
 SkipNext,
 VolumeOff,
 VolumeUp,
} from "@material-ui/icons";
import styles from './control.module.css'


export default function Control ({playing, onPlayPause, onForward, onRewind, played, onSeek, onSeekMouseUp, onSeekMouseDown, volume, onVolumeChangeHandler, onVolumeSeekUp, mute, onMute, currentTime, duration, controlRef}) {

    const useStyles = makeStyles({
        volumeSlider: {
          width: "100px",
          color: "white",
        },
       
        bottomIcons: {
          color: "#999",
          padding: "12px 8px",
        
        "&:hover": {
            color: "#fff",
          },
        },
       });
       
       const PrettoSlider = withStyles({
        root: {
          height: "20px",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        thumb: {
          height: 20,
          width: 20,
          backgroundColor: "white",
          border: "2px solid currentColor",
          marginTop: -3,
          marginLeft: -12,
        "&:focus, &:hover, &$active": {
            boxShadow: "inherit",
          },
        },
        active: {},
        valueLabel: {
          left: "calc(-50% + 4px)",
        },
        track: {
          height: 5,
          borderRadius: 4,
          width: "100%",
        },
        rail: {
          height: 5,
          borderRadius: 4,
        },
       })(Slider);


    return (
        <>
            <div className={styles.control_Container} ref={controlRef}>
                    <div className={styles.top__container}>
                        <h2>Video Player</h2>
                    </div>
                      {/* { Leaving out the play/rewind/fastforward buttons for now} */}
                      {/* {
                      <div className={styles.mid__container}>
                        
                          <div className={styles.icon__btn} onDoubleClick={onRewind}>
                            <FastRewind fontSize="medium" />
                          </div>
                          

                          <div className={styles.icon__btn} onClick={onPlayPause}>
                            { playing ? 
                            (
                              <Pause fontSize="medium" />
                            ) : 
                            (
                              <PlayArrow fontSize="medium" />
                            )

                            } {" "}
                          </div>
                          

                          <div className={styles.icon__btn} onDoubleClick={onForward}>
                              <FastForward fontSize="medium" />
                          </div>
                      </div>
                      } */}
                    

                    <div className={styles.bottom__container}>
                        <div className={styles.slider__container}>
                        <PrettoSlider
                          min = {0}
                          max = {100}
                          value = {played * 100} 
                          onChange={onSeek}
                          onChangeCommitted={onSeekMouseUp}
                          onMouseDown={onSeekMouseDown} />
                        </div>
                        <div className={styles.control__box}>
                        <div className={styles.inner__controls}>
                            <div className={styles.icon__btn} onClick={onPlayPause}>
                              { playing ? 
                              (
                                <Pause fontSize="medium" />
                              ) : 
                              (
                                <PlayArrow fontSize="medium" />
                              )

                              } {" "}
                            </div>
                            <div className={styles.icon__btn}>
                                <SkipNext fontSize="medium" />
                            </div>
                            <div className={styles.icon__btn}>
                                { mute ? (
                                  <VolumeOff fontSize="medium" />
                                ) : (
                                  <VolumeUp fontSize="medium" />
                                )

                                }
                            </div>
                            <Slider className={`${styles.volumeSlider}`} 
                                    onChange={onVolumeChangeHandler}
                                    value={volume * 100}
                                    onChangeCommitted={onVolumeSeekUp} />
                        </div>
                        <span className={styles.span}>{ currentTime} : {duration}</span>
                    </div>
                </div>
            </div>

        </>
    )
}