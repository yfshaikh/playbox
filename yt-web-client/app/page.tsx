import Image from 'next/image';
import Link from 'next/link';
import { getVideos, getThumbnail } from './firebase/functions';
import VideoCard from '@/components/video-card';

export default async function Home() {
  const videos = await getVideos(); // Fetch video data
  console.log(videos);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => {
            const file = video.files?.[0]?.filename || null;
            return file ? (
              <VideoCard
                key={video.id}
                href={`/watch?v=${file.split("_360p.mp4")[0]}`}
                thumbnailId={video.thumbnail}
                title={video.title || ""}
              />
            ) : null;
          })}
        </div>
        
        {videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-medium text-gray-400">No videos found</h2>
            <p className="mt-2 text-gray-500">Upload your first video to get started</p>
          </div>
        )}
      </div>
    </main>
  );
}

export const revalidate = 30;