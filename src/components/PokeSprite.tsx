'use client'

import { useInView } from 'react-intersection-observer';
import fallback from '@/src/assets/images/pk_fallback.svg';
import React, { useEffect, useState } from 'react';

interface SpriteProps {
    slug: string;
}

export default React.memo(function PokeSprite({ slug }: SpriteProps) {
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/sprites/${slug}`
    const [loadedImage, setLoadedImage] = useState<string | null>(null);

    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    useEffect(() => {
        if (inView) {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                setLoadedImage(url);
            };
        }
    }, [inView]);
    
    return (
        <img ref={ref} src={loadedImage || fallback.src} />
    )
})