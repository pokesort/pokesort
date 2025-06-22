"use client"

import { useTranslations } from 'next-intl';
import Puzzle from '@/src/components/Puzzle';
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useCallback, useEffect, useState } from 'react';
import { FIELD_OPTIONS } from '@/src/scripts/utils';
import Modal from '@/src/components/Modal';

export default function InfinitePage() {
    const t = useTranslations();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generated, setGenerated] = useState<boolean>(false);

    const [puzzle, setPuzzle] = useState<PuzzleData>();
    const [dictionary, setDictionary] = useState<any>();
    const [generationLimit, setGenerationLimit] = useState<number>(9);
    const [excludeFields, setExcludeFields] = useState<string[]>([]);

    useEffect(() => {
        if (!generated)
            return;

        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const body = JSON.stringify({
                    'generation': generationLimit,
                    'excludeFields': excludeFields
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
    }, [generated])

    const handleCheckbox = useCallback((option: string) => {
        setExcludeFields((prev: string[]) => {
            if (prev.includes(option)) {
                return [...prev].filter(item => item !== option);
            } else {
                return [...prev, option];
            }
        });
    }, []);

    return (
        <>
            <Modal title="Gerar Puzzle" background={false} id="generate-modal" canClose={false} isOpen={!generated}>
                <div style={{display: 'flex', maxWidth: '500px', flexWrap: 'wrap', gap: '0.5rem'}}>
                    <label style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                        Limite de geração:
                        <select value={generationLimit} onChange={(e) => setGenerationLimit(Number(e.target.value))}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((generation) => (
                                <option value={generation} key={generation}>Geração {t(`groupnames.generation.${generation}`)}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Excluir categorias:
                    </label>
                    {Object.keys(FIELD_OPTIONS).map((option, index) => (
                        <label key={index}>
                            <input type="checkbox" onChange={(e) => handleCheckbox(option)} checked={excludeFields.includes(option)}/>
                            {option}
                        </label>
                    ))}
                </div>
                <button className="modal-content-div" onClick={() => {if(!loading) setGenerated(true)}}>
                    Gerar
                </button>
            </Modal>            
            {generated && <Puzzle
                puzzle={puzzle}
                setPuzzle={setPuzzle}
                type="infinite"
                dictionary={dictionary}
                loading={loading}
                setLoading={setLoading}
                error={error}
                setError={setError}
            />}
        </>
    )
}