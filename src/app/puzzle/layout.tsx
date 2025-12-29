import { Metadata } from "next";
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return {
    title: "Puzzle",
  };
}

export default function PuzzleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>; 
}