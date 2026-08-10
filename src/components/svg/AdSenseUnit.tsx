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
}

export default function AdSenseUnit({ slot, format = 'auto', responsive = true, classes="" }: AdUnitProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${classes}`}
      style={{ display: 'block', width:'728px', height: '90px' }}
      data-ad-client="ca-pub-5104539413199771"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
}