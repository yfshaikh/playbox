import Image from 'next/image';
import Link from 'next/link';
import { getVideos, getThumbnail } from './firebase/functions';
import styles from './page.module.css'
import Thumbnail from './thumbnail';

export default async function Home() {
  const videos = await getVideos(); // Fetch video data
  console.log(videos)

  return (
    <main className={styles.main}>
      <div className={styles.video_container}>
      {videos.map((video) => {
        const file = video.files?.[0]?.filename || null;
        return file ? (
          <Link href={`/watch?v=${file.split('_360p.mp4')[0]}`} key={video.id}>
            <Thumbnail thumbnailId={video.thumbnail} />
          </Link>
        ) : null;
      })}
      </div>
    </main>
  );
}
