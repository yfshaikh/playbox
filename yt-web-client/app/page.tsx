import Image from 'next/image';
import Link from 'next/link';
import { getVideos, getThumbnail } from './firebase/functions';
import styles from './page.module.css'
import Thumbnail from './thumbnail';

export default async function Home() {
  const videos = await getVideos(); // Fetch video data

  return (
    <main className={styles.main}>
      <div className={styles.video_container}>
        {videos.map((video) => (
          <Link href={`/watch?v=${video.filename}`} key={video.id}>
              <Thumbnail thumbnailId={video.thumbnail} />
          </Link>
        ))}
      </div>
    </main>
  );
}

/*
{
  videos.map((video) => (
    <Link href={`/watch?v=${video.filename}`} key={video.id}>
      <Image src={'/thumbnail.png'} alt='video' width={300} height={150}
        className={styles.thumbnail}/>
    </Link>
  ))
}
  */