import { Metadata } from "next";
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return {
    title: t(`header.archive`),
  };
}

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>; 
}