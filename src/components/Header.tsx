import { useTranslations } from 'next-intl';
import Link from 'next/link';

import '@/src/styles/components/Header.scss';
import SvgLogo from './svg/SvgLogo';
import HamburgerIcon from './svg/HamburgerIcon';
import { useEffect, useState } from 'react';

import Notices from './Notices';
import Tutorial from './Tutorial';
import PokeSprite from './PokeSprite';

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
    const [noticesOpen, setNoticesOpen] = useState<boolean>(false);
    const [tutorialOpen, setTutorialOpen] = useState<boolean>(false);

    const pages = [
        {route: '/daily', label: t('daily'), beta: false},
        {route: '/infinite', label: t('infinite'), beta: false},
        {route: '/archive', label: t('archive'), beta: false},
        {route: '/dex', label: t('dex'), beta: false},
    ] as Page[];

    useEffect(() => {
        const handleScroll = () => setMenuOpen(false);
        const handleTutorialOpen = () => setTutorialOpen(true);
        const handleNoticesOpen = () => setNoticesOpen(true);

        document.addEventListener('scroll', handleScroll);
        window.addEventListener('open-tutorial', handleTutorialOpen);
        window.addEventListener('open-notices', handleNoticesOpen);
        
        return () => {
            document.removeEventListener('scroll', handleScroll);
            window.removeEventListener('open-tutorial', handleTutorialOpen);
            window.removeEventListener('open-notices', handleNoticesOpen);
        }
    }, [])
    

    return (
        <>
            <header data-path={pathname}>
                <Link id="home" href="/">
                    <SvgLogo/>
                    <h1>POKESORT</h1>
                </Link>
                
                <div className="header-group">
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
                    </div>
                    <a className="header-button" onClick={() => setMenuOpen(prev => !prev)}>
                        <div id="profile-icon">
                            <PokeSprite slug="egg.png" />
                        </div>
                    </a>
                    <button id="menu-icon" className="header-button" onClick={() => setMenuOpen(prev => !prev)}>
                        <HamburgerIcon/>
                    </button>
                </div>
            </header>
            <Notices noticesOpen={noticesOpen} setNoticesOpen={setNoticesOpen} />
            <Tutorial tutorialOpen={tutorialOpen} setTutorialOpen={setTutorialOpen} pathname={pathname} />
        </>
    )
}