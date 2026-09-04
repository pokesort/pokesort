import { useTranslations } from 'next-intl';
import Link from 'next/link';

import '@/src/styles/components/Header.scss';
import SvgLogo from './svg/SvgLogo';
import HamburgerIcon from './svg/HamburgerIcon';
import { useCallback, useEffect, useState } from 'react';

import Notices from './Notices';
import Tutorial from './Tutorial';
import PokeSprite from './PokeSprite';
import { clsx } from 'clsx';

type Page = {
    route?: string;
    alias?: string;
    label: string;
    subpages?: Page[];
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
        {route: '/daily', label: t('daily')},
        {label: t('modes'), subpages: [
            {route: '/infinite', label: t('infinite')},
            {route: '/construction', label: t('who')},
        ]},
        {route: '/archive', label: t('archive'), alias: '/puzzle'},
        {route: '/dex', label: t('dex')},
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

    const getPageClasses = (page: Page) => {
        return clsx(
            "header-nav-item",
            {
                "selected": isPageSelected(page),
                "with-subpages": page.subpages
            }
        )
    }

    const isPageSelected = useCallback((page: Page) => {
        if (pathname == null) return false;

        if (page.route != undefined &&
            pathname.includes(page.route) ||
            page.alias != undefined &&
            pathname.includes(page.alias)) return true;
        
        if (page.subpages) {
            let isSelected = false

            page.subpages.forEach((subpage: Page) => {
                if (isPageSelected(subpage)) {
                    isSelected = true;
                }
            })

            return isSelected;
        }

        return false;

    }, [pathname])

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
                            {pages && pages.map((page: Page, index: number) => {
                                return (
                                    <li key={index} className="header-nav-container">
                                        <Link
                                            href={page.route ?? ""}
                                            className={getPageClasses(page)}>
                                            {page.label}
                                        </Link>
                                        {page.subpages && page.subpages.map((subpage: Page, subindex: number) => (
                                            <Link
                                                key={subindex}
                                                href={subpage.route ?? ""}
                                                className={getPageClasses(subpage)}>
                                                {subpage.label}
                                            </Link>
                                        ))}
                                    </li>
                                )
                            })}
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