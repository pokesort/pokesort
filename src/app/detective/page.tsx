"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Infinite.scss";
import { useCallback, useEffect, useRef, useState } from 'react';

import Modal from '@/src/components/Modal';
import Input from '@/src/components/forms/Input';
import GridIcon from '@/src/components/svg/GridIcon';
import Loading from '@/src/components/Loading';
import { useForm } from 'react-hook-form';
import ErrorToast from '@/src/components/ToastError';
import Puzzle, { PuzzleDetective } from '@/src/components/puzzle/PuzzleDetective';
import { shuffleArray } from '@/src/scripts/utils';
import SelectDetectiveChallenge from '@/src/components/forms/SelectDetectiveChallenge';

export default function InfinitePage() {
    const t = useTranslations();
    const form = useForm();
    const formWatch = form.watch();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [initial, setInitial] = useState<boolean>(true);
    const [detectiveModalOpen, setDetectiveModalOpen] = useState<boolean>(true);

    const [puzzle, setPuzzle] = useState<PuzzleDetective | undefined>(undefined);
    const [dictionary, setDictionary] = useState<any>({});
    const [isSolved, setIsSolved] = useState<boolean>(false);

    useEffect(() => {
        if (initial) return;

        setIsSolved(false);
        setPuzzle(undefined);
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {

            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const body = {...formWatch};
                
                const [puzzleResponse] = await Promise.all([
                    fetch(`/api/detective/get`, {
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
                    setDictionary({});
                    setLoading(false);
                    setInitial(true);
                    return;
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);

                puzzleData.pokemons = shuffleArray(puzzleData.pokemons);
                setPuzzle(puzzleData);
                setDictionary(puzzleData.dictionary)
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
        setDetectiveModalOpen(false);
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
        challenge_options[`${challenge}`] = t(`puzzle.challenge.detective.${challenge}`);
    });
    
    return (
        <>
            <ErrorToast error={error} />
            {!initial &&
                (!loading && puzzle != undefined ?
                    <Puzzle
                        puzzle={puzzle}
                        dictionary={dictionary}
                        refreshPuzzle={refreshPuzzle}
                        isSolved={isSolved}
                        setIsSolved={setIsSolved}
                    />
                    :
                    <>
                        <div className={`window-container cut-left`}>
                            <section className="window-info-row">
                                <p></p>
                            </section>
                            <Loading expand={true} />
                        </div>
                    </>
                )
            }
            <Modal title={t('puzzle.detective.label')} id={"detective-modal"} isOpen={detectiveModalOpen} setIsOpen={setDetectiveModalOpen} canClose={!initial} background={!initial}>
                <p>{t(`puzzle.detective.description-1`)}</p>
                <p>{t(`puzzle.detective.description-2`)}</p>
                <div className="infinite-menu">
                    <div style={{paddingTop: ".5rem"}}>
                        <Input type="select" style={{width: "100%"}} label={t(`puzzle.infinite.generation`)} name="generation" defaultValue="9" options={gen_options} form={form} />
                        <Input type="select" style={{width: "100%"}} label={t('puzzle.detective.guess-limit')} name="guess_limit" options={{0: t(`puzzle.detective.limit-0`), 5: '5', 1: '1'}} defaultValue="0" form={form} />
                    </div>
                    <div>
                        <SelectDetectiveChallenge minimal={true} label={t(`puzzle.challenge.label`)} style={{width: "100%"}} defaultValue={'1'} options={challenge_options} form={form} />
                    </div>
                </div>
                <button className="form-button" onClick={generatePuzzle}>
                    {t('puzzle.detective.generate-button')}
                </button>
            </Modal>
            {isSolved &&
                <section id="detective-generate-button" className="puzzle-extra-button">
                    <button onClick={() => setDetectiveModalOpen(true)}>
                        <GridIcon/>
                        <p>{t('puzzle.detective.generate')}</p>
                    </button>
                </section>
            }
        </>
    )
}