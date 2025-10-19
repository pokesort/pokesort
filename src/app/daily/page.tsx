"use client"

import Puzzle from '@/src/components/Puzzle';
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useEffect, useState } from 'react';
import { shuffleArray } from '@/src/scripts/utils';
import Loading from '@/src/components/Loading';

const challengeKey = 'u_challenge';

export default function Daily() {
    const slug = `daily`;

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState<boolean>(false);

    const [puzzle, setPuzzle] = useState<PuzzleData>();
    const [dictionary, setDictionary] = useState<any>();
    const [challenges, setChallenges] = useState<any>();
    const [slugState, setSlugState] = useState<string>();

    const getPreferredChallenge = () => {
        return localStorage.getItem(challengeKey);
    }

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
                const query = slugState ?? `${slug}?challenge=${getPreferredChallenge() ?? "1"}`;
                const [puzzleResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/${query}`, {
                        method: 'GET', headers
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
                setChallenges(puzzleData.challenges);
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {                 
                setLoading(false);
            }
        };

        fetchPageData();
    }, [refresh])

    const refreshPuzzle = () => {
        setRefresh(prev => !prev);
    }

    return (
        <>
            {loading ?
                <div className={`window-container cut-left`}>
                    <section className="window-info-row">
                        <p></p>
                    </section>
                    <Loading expand={true} />
                </div>
            :
                <Puzzle
                    puzzle={puzzle}
                    setPuzzle={setPuzzle}
                    type="daily"
                    dictionary={dictionary}
                    challenges={challenges}
                    loading={loading}
                    setLoading={setLoading}
                    error={error}
                    setError={setError}
                    setSlug={setSlugState}
                    refreshPuzzle={refreshPuzzle}
                />
            }
        </>
    )
}