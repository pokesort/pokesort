"use client"

import { useTranslations } from 'next-intl';
import Puzzle from '@/src/components/Puzzle';
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FIELD_OPTIONS } from '@/src/scripts/utils';

import Modal from '@/src/components/Modal';
import Input from '@/src/components/forms/Input';
import GridIcon from '@/src/components/svg/GridIcon';
import Loading from '@/src/components/Loading';
import { useForm } from 'react-hook-form';

export default function InfinitePage() {
    const t = useTranslations();
    const generateRef = useRef<any>(undefined);
    const form = useForm();
    const formWatch = form.watch();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [initial, setInitial] = useState<boolean>(true);

    const [puzzle, setPuzzle] = useState<PuzzleData | undefined>(undefined);
    const [dictionary, setDictionary] = useState<any>();

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
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/generate?infinite=true`, {
                        method: 'POST', headers, body: JSON.stringify(body)
                    }),
                ]);
                if (!puzzleResponse.ok) {
                    const errorData = await puzzleResponse.json();

                    if (errorData.code === 'MAX_ATTEMPTS') {
                        await fetchPageData();
                    } else {
                        throw new Error('Erro ao obter informações do puzzle.');
                    }                    
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
    }, [refresh])

    const generatePuzzle = useCallback(() => {
        if(!loading) {
            setInitial(false);
            setRefresh(prev => !prev);
        }
    }, [loading])

    const gen_options: Record<string, string> = {};
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((gen: number) => {
        gen_options[`${gen}`] = 'Geração '+t(`groupnames.generation.${gen}`);
    });
    const exclude_options: Record<string, string> = {};
    {Object.keys(FIELD_OPTIONS).forEach((option: string) => {
        exclude_options[option] = t(`groupnames.${option}.short`);
    });

    return (
        <>
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
                        loading={loading}
                        setLoading={setLoading}
                        error={error}
                        setError={setError}
                    />
                )
            }            
            <div className={`window-container cut-left ${!initial ? "floating": ""}`}>
                <section className="window-info-row">
                    <GridIcon/>
                    <p>{t('puzzle.infinite-generate')}</p>
                </section>
                <div style={{display: 'flex', flexDirection: 'column', maxWidth: '500px', gap: '0.5rem'}}>
                    <Input type="select" label="Limite de Geração" name="generation" defaultValue="9" options={gen_options} form={form} />
                    <Input type="cloud" label="Ignorar Categorias" name="excludeFields" options={exclude_options} form={form} />
                </div>
                <button className="form-button" onClick={generatePuzzle}>
                    Gerar
                </button>
            </div>
        </>
    )
}}