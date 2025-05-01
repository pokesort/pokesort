"use client"

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function ErrorPage() {
    const t = useTranslations("header");

    return (
        <section className="error-page">
          <h1>500 – Internal Server Error</h1>
        </section>
      );
}