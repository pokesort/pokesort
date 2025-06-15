import Puzzle from '@/src/components/Puzzle';
import { notFound, redirect } from 'next/navigation';

interface PuzzlePageProps {
  params: Promise<{ slug: string }>
}

export default async function PuzzlePage({params}: PuzzlePageProps) {
    const { slug } = await params;

    if (slug === 'daily') {
        redirect('/daily');
    }

    return (
        <Puzzle puzzleId={slug} />
    )
}