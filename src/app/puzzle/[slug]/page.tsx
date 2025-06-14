import Puzzle from '@/src/components/Puzzle';
import { notFound, redirect } from 'next/navigation';

interface PuzzleProps {
    params: {
        slug?: string
    }
}

export default function Daily({ params }: PuzzleProps ) {
    const { slug } = params;

    if (!slug || slug.length <= 0 ) {
        notFound();
    }
    if (slug == 'daily') {
        redirect('/daily');
    }

    return (
        <Puzzle puzzleId={slug} />
    )
}