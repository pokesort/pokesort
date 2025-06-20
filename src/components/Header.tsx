import { useTranslations } from 'next-intl';
import Link from 'next/link';

import '@/src/styles/components/Header.scss';
import SvgLogo from './svg/SvgLogo';
import HamburgerIcon from './svg/HamburgerIcon';
import { useEffect, useState } from 'react';

interface HeaderProps {
    pathname: string | null;
}

export default function Header ({ pathname }: HeaderProps) {
    const t = useTranslations("header");

    const [menuOpen, setMenuOpen] = useState<boolean>(false);

    const pages = [
        'daily', 'archive', 'infinite', 'dex'
    ]

    useEffect(() => {
        const handleScroll = () => setMenuOpen(false);

        document.addEventListener('scroll', handleScroll);
        
        return () => {
            document.removeEventListener('scroll', handleScroll);
        }
    }, [])
    

    return (
        <header>
            <Link id="home" href="/">
                <SvgLogo/>
                <h1>POKESORT</h1>
            </Link>
            
            <button id="menu-icon" onClick={() => setMenuOpen(prev => !prev)}>
                <HamburgerIcon/>
            </button>
            <nav className={menuOpen ? 'open' : ''}>
                {pages && pages.map((page: string, index: number) => (
                    <Link
                        key={index}
                        href={`/${page}`}
                        className={pathname === `/${page}` ? 'selected' : ''}>
                            {t(page)}{page == 'infinite' ? ' ᵇᵉᵗᵃ' : ''}
                    </Link>
                ))}
            </nav>
        </header>
    )
}