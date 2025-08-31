"use client"

import PuzzleManage from '@/src/components/PuzzleManage';
import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import { useEffect, useState } from 'react';
import { notFound, redirect, useParams } from 'next/navigation';

export default function PuzzleCreatePage() {
    const params = useParams();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [puzzle, setPuzzle] = useState<PuzzleData>();
    const [dictionary, setDictionary] = useState<any>();

    return (
        <PuzzleManage
        />
    )
}