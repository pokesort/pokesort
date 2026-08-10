'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdUnitProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  classes?: string;
  width?: string;
  height?: string;
}

export default function AdSenseUnit({ slot, format = '', responsive = true, classes="", width="720px", height="90px" }: AdUnitProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div
      className="ad-container">
      <ins
        className={`adsbygoogle ${classes}`}
        style={{ 
          display: 'inline-block', 
          width: width, 
          height: height
        }}
        data-ad-client="ca-pub-5104539413199771"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}