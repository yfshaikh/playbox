import Link from "next/link";
import Thumbnail from "@/app/newThumbnail";

interface VideoCardProps {
  href: string;
  thumbnailId?: string;
  title: string;
}

export default function VideoCard({ href, thumbnailId, title }: VideoCardProps) {
  return (
    <Link href={href} className="group">
      <div className="overflow-hidden rounded-xl bg-gray-800 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600 hover:-translate-y-1">
        <div className="aspect-video relative">
          <Thumbnail thumbnailId={thumbnailId} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-50"></div>
          <div className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur-sm p-1 rounded-full">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5 text-purple-400"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-100 line-clamp-2 h-12 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-500 transition-all duration-300">
            {title || "Untitled Video"}
          </h3>
        </div>
      </div>
    </Link>
  );
}