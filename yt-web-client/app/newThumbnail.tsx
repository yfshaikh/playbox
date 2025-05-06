'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getThumbnail } from './firebase/functions'; 

interface ThumbnailProps {
    thumbnailId?: string
  }
  
  export default function Thumbnail({ thumbnailId }: ThumbnailProps) {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const thumbnailPrefix = 'https://storage.googleapis.com/processed-thumbnail-bucket-yt/';

    useEffect(() => {
        async function fetchThumbnail() {
        try {
            const response = await getThumbnail({ thumbnailId });
            if (response?.filename) {
            setThumbnail(response.filename); // Assign the string value
            } else {
            console.error('Thumbnail response missing filename');
            }
        } catch (err) {
            console.error('Error fetching thumbnail:', err);
        }
        } 

        if (thumbnailId) {
        fetchThumbnail();
        }
    }, [thumbnailId]);

    return (
      <div className="w-full h-full bg-zinc-800 overflow-hidden">
        <img
          src={thumbnailPrefix + thumbnail}
          alt="Video thumbnail"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    )
  }
  