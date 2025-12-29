import { Metadata } from "next";
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return {
    title: t(`header.infinite`),
  };
}

export default function InfiniteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>; 
}