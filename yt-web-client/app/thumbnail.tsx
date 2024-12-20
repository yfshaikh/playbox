'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getThumbnail } from './firebase/functions'; // Import directly here
import stlyes from './page.module.css'

function Thumbnail({ thumbnailId }) {
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
    <div>
      {thumbnail ? (
        <Image
          src={thumbnailPrefix + thumbnail}
          alt={`Thumbnail for ${thumbnailId}`}
          width={200}  
          height={120} 
          className={stlyes.thumbnail}
        />
      ) : (
        <Image
          src='/default_thumbnail.png'
          alt={`Default thumbnail`}
          width={200}  
          height={120} 
          className={stlyes.thumbnail}
        />
      )}
    </div>
  );
}

export default Thumbnail;


