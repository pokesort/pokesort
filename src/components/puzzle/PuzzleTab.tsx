import React, { useEffect } from "react";
import { useInView } from 'react-intersection-observer';

interface PuzzleTabProps {
    setVisibleTab: React.Dispatch<React.SetStateAction<number>>;
    tab: number;
    children?: React.ReactNode;
}

export default React.memo(function PuzzleTab ({setVisibleTab, children, tab}: PuzzleTabProps) {
    const { ref: viewRef, inView } = useInView({ threshold: 0.1 });

    useEffect(() => {
        if (inView) {
            setVisibleTab(tab);
        }
    }, [inView, tab]);
    
    return (
        <li ref={viewRef} className="puzzle-tab" data-tab={tab}>
            {children}
        </li>
    )
})