"use client"

import { useTranslations } from 'next-intl';
import Puzzle from '@/src/components/Puzzle';
import "@/src/styles/components/Infinite.scss";
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FIELD_OPTIONS, CHALLENGE_FIELDS } from '@/src/scripts/utils';
import { useSearchParams } from 'next/navigation';

import Modal from '@/src/components/Modal';
import Input from '@/src/components/forms/Input';
import GridIcon from '@/src/components/svg/GridIcon';
import Loading from '@/src/components/Loading';
import { useForm } from 'react-hook-form';
import ChallengeSelect from '@/src/components/forms/ChallengeSelect';
import ErrorToast from '@/src/components/ToastError';

const challengeKey = 'u_challenge';
const infiniteChallengeFallback = "1";
const validInfiniteChallenges = new Set(["1", "2", "3", "4"]);

export default function InfinitePage() {
    const t = useTranslations();
    const generateRef = useRef<any>(undefined);
    const form = useForm();
    const formWatch = form.watch();
    const challengeQuery = useSearchParams()?.get("c");

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [initial, setInitial] = useState<boolean>(true);

    const [puzzle, setPuzzle] = useState<PuzzleData | undefined>(undefined);
    const [dictionary, setDictionary] = useState<any>();
    const [challenges, setChallenges] = useState<any>();
    const [excludeOptions, setExcludeOptions] = useState<Record<string, string>>({});
    const [preferredChallenge, setPreferredChallenge] = useState<string>();

    const getPreferredChallenge = () => {
        return challengeQuery ?? localStorage.getItem(challengeKey);
    }

    const sanitizeInfiniteChallenge = (value: string | null) => {
        if (!value) return infiniteChallengeFallback;
        return validInfiniteChallenges.has(value) ? value : infiniteChallengeFallback;
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const value = getPreferredChallenge();
            setPreferredChallenge(sanitizeInfiniteChallenge(value));
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [])

    useEffect(() => {
        if (initial) return;        

        setPuzzle(undefined);
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {

            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const body = {...formWatch};
                if (body.excludeFields == false) body.excludeFields = [];
                const queries = `amount=1&infinite=true&generation=${form.watch('generation')}&challenge=${form.watch('challenge')}&rows=${form.watch('rows') ?? ''}&cols=${form.watch('cols') ?? ''}`;
                
                const [puzzleResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/generate?${queries}`, {
                        method: 'POST', headers, body: JSON.stringify(body)
                    }),
                ]);
                if (!puzzleResponse.ok) {
                    const errorData = await puzzleResponse.json();

                    if (errorData.error.name == "MaxAttemptsError") {
                        await fetchPageData();
                        return;
                    }
                    
                    setError(errorData.message);
                    setPuzzle(undefined);
                    setLoading(false);
                    setInitial(true);
                    return;
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);
              
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

    const generatePuzzle = useCallback(() => {
        if(!loading) {
            setInitial(false);
            refreshPuzzle();
        }
    }, [loading])

    const gen_options: Record<string, string> = {};
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((gen: number) => {
        gen_options[`${gen}`] = t(`groupnames.generation.long`)+t(`groupnames.generation.${gen}`);
    });
    const challenge_options: Record<string, string> = {};
    [1, 2, 3, 4].forEach((challenge: number) => {
        challenge_options[`${challenge}`] = t(`puzzle.challenge.${challenge}`);
    });
    
    useEffect(() => {
        if (!form.watch('challenge')) return;
        const exclude_options: Record<string, string> = {};
        const groups = CHALLENGE_FIELDS[form.watch('challenge') as 1 | 2 | 3 | 4];
        Object.keys(groups).forEach((option: string) => {
            exclude_options[option] = t(`groupnames.${option}.short`);
        });
        setExcludeOptions(exclude_options);
    }, [form.watch('challenge')]);

    return (
        <>
            <ErrorToast error={error} />
            {!initial &&
                (loading ?
                    <>
                        <div className={`window-container cut-left`}>
                            <section className="window-info-row">
                                <p></p>
                            </section>
                            <Loading expand={true} />
                        </div>
                    </>
                    :
                    <Puzzle
                        puzzle={puzzle}
                        setPuzzle={setPuzzle}
                        type="infinite"
                        dictionary={dictionary}
                        challenges={challenges}
                        loading={loading}
                        setLoading={setLoading}
                        error={error}
                        setError={setError}
                        refreshPuzzle={refreshPuzzle}
                    />
                )
            }
            {!preferredChallenge ?
                <Loading expand={false} />
            :
                <div className={`infinite-window window-container cut-left ${!initial ? "floating": ""}`}>
                    <section className="window-info-row">
                        <GridIcon/>
                        <p>{t('puzzle.infinite.generate')}</p>
                    </section>
                    <div className="infinite-menu">
                        <div>
                            <Input type="select" style={{width: "100%"}} label={t(`puzzle.infinite.generation`)} name="generation" defaultValue="9" options={gen_options} form={form} />
                            <ChallengeSelect minimal={true} label={t(`puzzle.challenge.label`)} style={{width: "100%"}} defaultValue={preferredChallenge} options={challenge_options} form={form} />
                        </div>
                        <div>
                            <Input type="select" style={{width: "100%"}} label={t('puzzle.infinite.rows')} name="rows" options={{4: '4', 5: '5'}} defaultValue="4" form={form} />
                            <Input type="select" style={{width: "100%"}} label={t('puzzle.infinite.cols')} name="cols" options={{4: '4', 5: '5', 6: '6'}} defaultValue="4" form={form} />
                        </div>
                        <div>
                            <Input type="cloud" label={t('puzzle.infinite.exclude')} name="excludeFields" options={excludeOptions} form={form} />
                        </div>
                    </div>
                    <button className="form-button" onClick={generatePuzzle}>
                        {t('puzzle.infinite.button')}
                    </button>
                </div>
            }
        </>
    )
}