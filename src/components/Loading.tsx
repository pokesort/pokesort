import '@/src/styles/components/Loading.scss';
import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface LoadingProps {
    expand: boolean;
}

export default function Loading ({ expand }: LoadingProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationInstance = useRef<AnimationItem | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            if (animationInstance.current) animationInstance.current.destroy();

            animationInstance.current = lottie.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/AnimatedLoading.json',
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid slice',
                },
            });

            animationInstance.current.setSpeed(1);
            animationInstance.current.addEventListener('DOMLoaded', () => {
                const svgElement = containerRef.current?.querySelector('svg');
                if (svgElement) {
                    const unwantedPath = svgElement.querySelectorAll('path[fill="rgb(255,255,255)"], path[style*="mix-blend-mode: multiply;"]');
                    if (unwantedPath) {
                        unwantedPath.forEach(e => e.remove());
                    } else {
                        console.warn("Unwanted Lottie path not found with current selector.");
                    }
                }
            });
        }

        return () => {
            if (animationInstance.current) {
                animationInstance.current.destroy();
                animationInstance.current = null;
            }
        };
    }, []);

    return (
        <section className={`loading ${expand ? 'expand': ''}`}>
            <div ref={containerRef} />
        </section>
    );
}