"use client"

import { useTranslations } from "use-intl";
import constructionGif from "@/src/assets/images/construction.gif";

import "@/src/styles/components/Construction.scss";

export default function Construction() {
    const t = useTranslations();
    
    return (
        <img id="construction" src={constructionGif.src}/>
    );
}