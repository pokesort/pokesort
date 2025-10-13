import { useTranslations } from 'next-intl';
import Link from 'next/link';

import '@/src/styles/components/Header.scss';
import SvgLogo from './svg/SvgLogo';
import HamburgerIcon from './svg/HamburgerIcon';
import { useEffect, useState } from 'react';

import HeaderHelp from './svg/HeaderHelp';
import HeaderInfo from './svg/HeaderInfo';
import HeaderTwitter from './svg/HeaderTwitter';
import HeaderGit from './svg/HeaderGit';
import HeaderNotice from './svg/HeaderNotice';
import Notices from './Notices';

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

    const pages = [
        {route: '/daily', label: t('daily'), beta: false},
        {route: '/infinite', label: t('infinite'), beta: false},
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
        <>
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
                    <ul className="icons">
                        <Link href="" onClick={() => setNoticesOpen(true)}>
                            <HeaderNotice />
                        </Link>                    
                        <Link href="">
                            <HeaderHelp />
                        </Link>
                        <Link href="about">
                            <HeaderInfo />
                        </Link>
                        {/* <Link target="_blank" href="https://x.com/bunnysammy_">
                            <HeaderTwitter />
                        </Link>
                        <Link target="_blank" href="https://github.com/bunny-sammy/pokesort">
                            <HeaderGit />
                        </Link> */}
                    </ul>
                </div>
                <button id="menu-icon" onClick={() => setMenuOpen(prev => !prev)}>
                    <HamburgerIcon/>
                </button>
            </header>
            <Notices noticesOpen={noticesOpen} setNoticesOpen={setNoticesOpen} />
        </>
    )
}