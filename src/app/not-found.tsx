"use client"

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NotFound() {
    const t = useTranslations("header");

    return (
        <section className="not-found">
            <h1>404 – Page Not Found</h1>
        </section>
    );
}