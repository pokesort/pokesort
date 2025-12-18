"use client"

import PuzzleManage from '@/src/components/PuzzleManage';
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useEffect, useState } from 'react';
import { notFound, redirect, useParams } from 'next/navigation';
import ErrorToast from '@/src/components/ToastError';

export default function PuzzleCreatePage() {
    const params = useParams();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [puzzle, setPuzzle] = useState<PuzzleData>();

    return (
        <>
            <ErrorToast error={error} />
            <PuzzleManage
                error={error}
                setError={setError}
            />
        </>
    )
}