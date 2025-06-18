"use client"

import { useTranslations } from 'next-intl';
import Puzzle from '@/src/components/Puzzle';
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useEffect, useState } from 'react';

export default function InfinitePage() {
    const t = useTranslations();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [regenerate, setRegenerate] = useState<boolean>(false);

    const [puzzle, setPuzzle] = useState<PuzzleData>();
    const [dictionary, setDictionary] = useState<any>();
    const [generationLimit, setGenerationLimit] = useState<number>(9);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const body = JSON.stringify({
                    'generation': generationLimit
                })
                const [puzzleResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/generate?infinite=true`, {
                        method: 'POST', headers, body
                    }),
                ]);
                if (!puzzleResponse.ok) {
                    throw new Error('Erro ao obter informações do puzzle.');
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);
              
                if (process.env.NODE_ENV === "development") {
                    console.log(puzzleData.data);
                    console.log(puzzleData.dictionary);
                }
                setPuzzle(puzzleData.data);
                setDictionary(puzzleData.dictionary);
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {                
                setLoading(false);
            }
        };

        fetchPageData();
    }, [regenerate])

    return (
        <>
            <label style={{display: 'flex', flexDirection: 'column'}}>
                Limite de Geração
                <select value={generationLimit} onChange={(e) => setGenerationLimit(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((generation) => (
                        <option value={generation} key={generation}>Geração {t(`groupnames.generation.${generation}`)}</option>
                    ))}
                </select>
            </label>
            <button onClick={() => {if(!loading) setRegenerate(!regenerate)}}>Gerar Novamente</button>
            <Puzzle
                puzzle={puzzle}
                setPuzzle={setPuzzle}
                dictionary={dictionary}
                loading={loading}
                setLoading={setLoading}
                error={error}
                setError={setError}
            />
        </>
    )
}