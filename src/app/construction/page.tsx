"use client"

import { useTranslations } from "use-intl";

export default function Construction() {
    const t = useTranslations();
    
    return (
        <>{t(`home.construction-2`)}</>
    );
}