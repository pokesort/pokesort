import { useTranslations } from 'next-intl';
import Link from 'next/link';

import '@/src/styles/components/Header.scss';
import SvgLogo from './svg/SvgLogo';
import HamburgerIcon from './svg/HamburgerIcon';
import { useEffect, useState } from 'react';

type Page = {
    route: string;
    label: string;
    beta: boolean;
}

interface HeaderProps {
    pathname: string | null;
}

export default function Header ({ pathname }: HeaderProps) {
    const t = useTranslations("header");

    const [menuOpen, setMenuOpen] = useState<boolean>(false);

    const pages = [
        {route: '/daily', label: t('daily'), beta: false},
        {route: '/infinite', label: t('infinite'), beta: true},
        {route: '/archive', label: t('archive'), beta: false},
        {route: '/dex', label: t('dex'), beta: false},
    ] as Page[];

    useEffect(() => {
        const handleScroll = () => setMenuOpen(false);

        document.addEventListener('scroll', handleScroll);
        
        return () => {
            document.removeEventListener('scroll', handleScroll);
        }
    }, [])
    

    return (
        <header data-path={pathname}>
            <Link id="home" href="/">
                <SvgLogo/>
                <h1>POKESORT</h1>
            </Link>
            
            <div className={`menu ${menuOpen ? 'open' : ''}`}>
                <nav>
                    {pages && pages.map((page: Page, index: number) => (
                        <Link
                            key={index}
                            href={page.route}
                            className={pathname === page.route ? 'selected' : ''}>
                                {page.label}{page.beta ? ' ᵇᵉᵗᵃ' : ''}
                        </Link>
                    ))}
                </nav>
                {/* <p>?</p> */}
            </div>
            <button id="menu-icon" onClick={() => setMenuOpen(prev => !prev)}>
                <HamburgerIcon/>
            </button>
        </header>
    )
}