"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Infinite.scss";
import { useCallback, useEffect, useRef, useState } from 'react';

import Modal from '@/src/components/Modal';
import Input from '@/src/components/forms/Input';
import GridIcon from '@/src/components/svg/GridIcon';
import Loading from '@/src/components/Loading';
import { useForm } from 'react-hook-form';
import ChallengeSelect from '@/src/components/forms/SelectChallenge';
import ErrorToast from '@/src/components/ToastError';
import Puzzle, { PuzzleDetective } from '@/src/components/puzzle/PuzzleDetective';
import { shuffleArray } from '@/src/scripts/utils';

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
                    setLoading(false);
                    setInitial(true);
                    return;
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);
              
                puzzleData.pokemons = shuffleArray(puzzleData.pokemons);
               setPuzzle(puzzleData);
               console.log(puzzleData);
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

    return (
        <>
            <ErrorToast error={error} />
            {!initial &&
                (!loading && puzzle != undefined ?
                    <Puzzle
                        puzzle={puzzle}
                        setPuzzle={setPuzzle}
                        refreshPuzzle={refreshPuzzle}
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
                Whoa
                <button className="form-button" onClick={generatePuzzle}>
                    {t('puzzle.detective.generate')}
                </button>
            </Modal>
        </>
    )
}