"use client"

import PuzzleManage from '@/src/components/PuzzleManage';
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useEffect, useState } from 'react';
import { notFound, redirect, useParams } from 'next/navigation';
import ErrorToast from '@/src/components/ToastError';

export default function PuzzleCreatePage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [puzzle, setPuzzle] = useState<PuzzleData>();

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (['get', '', null].includes(slug)) {
                    setError('Não conseguimos encontrar este puzzle...');
                    return;
                }
                const [puzzleResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/${slug}`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!puzzleResponse.ok) {
                    setError('Não conseguimos encontrar este puzzle...');
                    return;
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);
              
                if (process.env.NODE_ENV === "development") {
                    console.log(puzzleData.data);
                }
                setPuzzle(puzzleData.data);
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {                
                setLoading(false);
            }
        };

        fetchPageData();
    }, [])

    return (
        <>
            <ErrorToast error={error} />
            <PuzzleManage
                error={error}
                setError={setError}
                puzzle={puzzle}
            />
        </>
    )
}