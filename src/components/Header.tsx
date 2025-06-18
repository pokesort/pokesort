import { useTranslations } from 'next-intl';
import Link from 'next/link';

import '@/src/styles/components/Header.scss';
import SvgLogo from './svg/SvgLogo';

interface HeaderProps {
    pathname: string | null;
}

export default function Header ({ pathname }: HeaderProps) {
    const t = useTranslations("header");

    const pages = [
        'daily', 'archive', 'infinite', 'dex'
    ]

    return (
        <header>
            <Link id="home" href="/">
                <SvgLogo/>
                <h1>POKESORT</h1>
            </Link>
            
            <nav>
                {pages && pages.map((page: string, index: number) => (
                    <Link
                        key={index}
                        href={`/${page}`}
                        className={pathname === `/${page}` ? 'selected' : ''}>
                            {t(page)}
                    </Link>
                ))}                
            </nav>
        </header>
    )
}