import { useTranslations } from 'next-intl';
import Link from 'next/link';

import '@/src/styles/components/ErrorPage.scss';
import Image from 'next/image';
import {useRouter} from 'next/navigation';

interface ErrorPageProps {
    code: string,
    message: string
}

export default function ErrorSection ({ code, message }: ErrorPageProps) {
    const t = useTranslations("error");
    const router = useRouter();
    const mimikyu = 10143;

    return (
        <section className="error">
            <div className="flex">
                <img alt="Mimikyu :(" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mimikyu}.png`}/>
                <div>
                    <h1>{t('error')} {code}</h1>
                    <p>{t(message)}</p>
                </div>
            </div>
            <button onClick={router.back}>{t('go-back')}</button>
        </section>
    )
}