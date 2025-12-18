"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { isBefore, isToday } from 'date-fns';
import { redirect } from 'next/navigation';
import ErrorToast from '@/src/components/ToastError';

import "@/src/styles/components/PuzzleList.scss";
import Loading from '@/src/components/Loading';
import { formatDate } from '@/src/scripts/utils';
import { useLocale, useTranslations } from 'use-intl';

import CalendarIcon from '@/src/components/svg/CalendarIcon';
import GridIcon from '@/src/components/svg/GridIcon';
import UserIcon from '@/src/components/svg/UserIcon';
import EditIcon from '@/src/components/svg/EditIcon';
import CloseIcon from '@/src/components/svg/CloseIcon';
import Modal from '@/src/components/Modal';

interface PuzzleCardProps {
    puzzle: PuzzleData;
    deletePuzzle: (id: string) => void;
}

const PuzzleCard = React.memo(({puzzle, deletePuzzle}: PuzzleCardProps) => {
    const t = useTranslations();
    const locale = useLocale();

    const date = formatDate(puzzle.date, locale);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);

    const statusSwitch = useMemo(() => {
        const date = puzzle.date == null ? null : new Date(puzzle.date);

        if (date == null) {
            return <>
                <div className="dot" data-status="0"></div>
                Aguardando
            </>
        } else if (isBefore(date, new Date()) || isToday(date)) {
            return <>
                <div className="dot" data-status="1"></div>
                Ativo
            </>
        } else {
            return <>
                <div className="dot" data-status="2"></div>
                Planejado
            </>
        }
    }, [puzzle])    

    return (
        <>
            <Modal id={"puzzle-success"} isOpen={deleteModal} setIsOpen={setDeleteModal} canClose={true} background={true}>
                <div className="modal-content-div">
                    <p>
                        Deseja mesmo deletar este puzzle?                        
                    </p>
                </div>
                <button className="modal-content-div" onClick={ () => window.open(`/puzzle/${puzzle._id}`, '_blank') }>
                    <p>Visualizar Puzzle</p>
                </button>
                <div className="button-row">
                    <button className="modal-content-div" onClick={() => deletePuzzle(puzzle._id)}>
                        <p>Sim</p>
                    </button>
                    <button className="modal-content-div" onClick={() => setDeleteModal(false)}>
                        <p>Não</p>
                    </button>
                </div>
            </Modal>
            <tr className="puzzle-card-title">
                <td>
                    {statusSwitch}
                </td>
                <td>
                    <CalendarIcon />
                    {date != "Invalid Date" ? date : "Sem data"}
                </td>
                <td>
                    <GridIcon />
                    {puzzle.cols}x{puzzle.rows}
                </td>
                <td>
                    <UserIcon />
                    {t(`puzzle.from.${puzzle.from}`)}
                </td>

                <td className="buttons">
                    <button onClick={() => redirect(`/admin/puzzle/${puzzle._id}`)}>
                        <EditIcon />
                    </button>
                    <button onClick={() => setDeleteModal(true)}>
                        <CloseIcon />
                    </button>
                </td>
            </tr>            
        </>
    )
})

export default function PuzzleListPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [puzzles, setPuzzles] = useState<PuzzleData[]>();

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const [puzzleResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/get`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!puzzleResponse.ok) {
                    setError('Erro ao obter informações dos puzzles.');
                    return;
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);

                if (process.env.NODE_ENV === "development") {
                    console.log(puzzleData.puzzles);
                }
                setPuzzles(puzzleData.puzzles);
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {                 
                setLoading(false);
            }
        };

        fetchPageData();
    }, []);

    const deletePuzzle = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const headers = {
                'Content-Type': 'application/json'
            };            
            
            const [response] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/${id}`, {
                    method: 'DELETE', headers
                }),
            ]);
            if (!response.ok) {
                const data = await response.json();
                setError(data.message);
                setLoading(false);
                return;
            }
            const [data] = await Promise.all([
                response.json(),
            ]);
            setLoading(false);
            setPuzzles(prev =>
                prev ? prev.filter(p => p._id !== id) : prev
            );
        } catch (e) {
            console.error(e);
            setError('Não foi possível conectar ao servidor. Tente novamente.');
            setLoading(false);
        }
    }

    return (
        <>
            <ErrorToast error={error} />
            
            {!puzzles || loading ?
                <Loading expand={false} />
            :
                <table className="puzzle-card-table">
                    <tbody>
                        {puzzles.map((puzzle: PuzzleData, index: number) => (
                            <PuzzleCard key={puzzle._id} puzzle={puzzle} deletePuzzle={deletePuzzle} />
                        ))}
                    </tbody>
                </table>
            }
        </>
    )
}