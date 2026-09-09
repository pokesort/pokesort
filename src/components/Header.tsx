import { _Translator, useTranslations } from 'next-intl';
import Link from 'next/link';

import '@/src/styles/components/Header.scss';
import SvgLogo from './svg/SvgLogo';
import HamburgerIcon from './svg/HamburgerIcon';
import { useCallback, useEffect, useState } from 'react';

import Notices from './Notices';
import Tutorial from './Tutorial';
import PokeSprite from './PokeSprite';
import { clsx } from 'clsx';
import { type ProfileData } from '../assets/types/UserData';
import Profile from './Profile';

const profileKey = 'u_profile';

type Page = {
    route?: string;
    alias?: string;
    label: string;
    subpages?: Page[];
}

interface HeaderProps {
    pathname: string | null;
}

const saveProfile = (profile: ProfileData) => {
    localStorage.setItem(profileKey, JSON.stringify(profile));
}

const loadProfile = (t: _Translator<Record<string, any>>): ProfileData => {
    const data = localStorage.getItem(profileKey);
    if (!data) {
        return {name: t(`default-user`), partner: "egg"};
    }

    return JSON.parse(data);
}

export default function Header ({ pathname }: HeaderProps) {
    const t = useTranslations("header");

    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [noticesOpen, setNoticesOpen] = useState<boolean>(false);
    const [tutorialOpen, setTutorialOpen] = useState<boolean>(false);
    const [profileOpen, setProfileOpen] = useState<boolean>(false);

    const [profile, setProfile] = useState<ProfileData>();

    const pages = [
        {route: '/daily', label: t('daily')},
        {label: t('modes'), subpages: [
            {route: '/infinite', label: t('infinite')},
            {route: '/pokewho', label: t('detective')},
        ]},
        {route: '/archive', label: t('archive'), alias: '/puzzle'},
        {route: '/dex', label: t('dex')},
    ] as Page[];

    useEffect(() => {
        if (profile) {
            saveProfile(profile);
        }
    }, [profile])

    useEffect(() => {
        const handleScroll = () => setMenuOpen(false);
        const handleTutorialOpen = () => setTutorialOpen(true);
        const handleNoticesOpen = () => setNoticesOpen(true);
        const handleProfileOpen = () => setProfileOpen(true);

        document.addEventListener('scroll', handleScroll);
        window.addEventListener('open-tutorial', handleTutorialOpen);
        window.addEventListener('open-notices', handleNoticesOpen);
        window.addEventListener('open-profile', handleProfileOpen);

        setProfile(loadProfile(t));
        
        return () => {
            document.removeEventListener('scroll', handleScroll);
            window.removeEventListener('open-tutorial', handleTutorialOpen);
            window.removeEventListener('open-notices', handleNoticesOpen);
            window.removeEventListener('open-profile', handleProfileOpen);
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
                                        {page.route ?
                                            <Link
                                                href={page.route}
                                                className={getPageClasses(page)}>
                                                {page.label}
                                            </Link>
                                        :
                                            <div
                                                className={getPageClasses(page)}>
                                                {page.label}
                                            </div>
                                        }
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
                    <button className="header-button" onClick={() => setProfileOpen(prev => !prev)}>
                        <div id="profile-icon">
                            <PokeSprite slug={`${profile?.partner ?? "egg"}.png`} />
                        </div>
                    </button>
                    <button id="menu-icon" className="header-button" onClick={() => setMenuOpen(prev => !prev)}>
                        <HamburgerIcon/>
                    </button>
                </div>
            </header>
            {profile &&
                <Profile
                    profileOpen={profileOpen}
                    setProfileOpen={setProfileOpen}
                    profile={profile}
                    setProfile={setProfile}
                />
            }
            <Notices
                noticesOpen={noticesOpen}
                setNoticesOpen={setNoticesOpen}
            />
            <Tutorial
                tutorialOpen={tutorialOpen}
                setTutorialOpen={setTutorialOpen}
                pathname={pathname}
            />
        </>
    )
}