"use client"

import Puzzle from '@/src/components/Puzzle';
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useEffect, useState } from 'react';
import { shuffleArray } from '@/src/scripts/utils';
import { notFound, redirect, useParams } from 'next/navigation';

export default function PuzzlePage() {
    const params = useParams();
    const slug = params?.slug as string;

    if (slug === 'daily')
        redirect('/daily');

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [puzzle, setPuzzle] = useState<PuzzleData>();
    const [pokemons, setPokemons] = useState<any>([]);    

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (['get', '', null].includes(slug)) {
                    throw new Error('Não conseguimos encontrar este puzzle...');
                }
                const [puzzleResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/${slug}`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!puzzleResponse.ok) {
                    throw new Error('Erro ao obter informações do puzzle.');
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);

                console.log(puzzleData.data);
                setPuzzle(puzzleData.data);
                setPokemons(shuffleArray(puzzleData.pokemon));
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {
                setLoading(true);                
                setTimeout(() => {                    
                    setLoading(false);
                }, 300);
            }
        };

        fetchPageData();
    }, [slug])

    return (
        <Puzzle
            puzzle={puzzle}
            setPuzzle={setPuzzle}
            pokemons={pokemons}
            loading={loading}
            setLoading={setLoading}
            error={error}
            setError={setError}
        />
    )
}