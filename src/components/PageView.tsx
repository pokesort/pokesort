import React, { useCallback, useEffect, useRef, useState } from 'react';

import "@/src/styles/components/PageView.scss";
import ArrowLeft from '@/src/components/svg/ArrowLeft';
import ArrowRight from '@/src/components/svg/ArrowRight';
import { useTranslations } from 'next-intl';

interface PageViewProps {
    children?: React.ReactNode; 
}

export default function PageView({ children }: PageViewProps) {
    const t = useTranslations("notices");
    const ref = useRef<HTMLUListElement>(null);

    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pages, setPages] = useState<HTMLLIElement[]>([]);

    useEffect(() => {
        if (ref.current) {
            setPages(Array.from(ref.current.querySelectorAll<HTMLLIElement>('li')));
        }
    }, [children]);

    useEffect(() => {
        pages.forEach((element, index) => {
            if (index == currentPage) {
                element.classList.add("active");
            } else {
                element.classList.remove("active");
            }
        })
    }, [currentPage, pages]);

    const prevPage = useCallback(() => {
        setCurrentPage(prev => Math.max(0, prev -= 1));
    }, [pages]);
    const nextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(pages.length-1, prev += 1));
    }, [pages]);

    return (
        <>
            <ul ref={ref} className="page-view">
                {children}
            </ul>
            <nav className="page-view-nav">
                <button className={currentPage == 0 ? "disabled" : ""} onClick={prevPage}>
                    <ArrowLeft />
                    {t(`previous`)}
                </button>
                <button className={currentPage == Math.max(0, pages.length-1) ? "disabled" : ""} onClick={nextPage}>
                    {t(`next`)}
                    <ArrowRight />
                </button>
            </nav>
        </>
    );
}