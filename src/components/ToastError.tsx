import '@/src/styles/components/ErrorToast.scss';
import React, { useEffect, useRef } from 'react';

interface ErrorToastProps {
    error: string | null;
}

export default function ErrorToast ({ error }: ErrorToastProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <>
            {error &&
                <div ref={containerRef} className="error-toast">
                    {error}
                </div>
            }
        </>
    );
}