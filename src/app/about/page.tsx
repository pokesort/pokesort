import { useTranslations } from 'next-intl';
import "@/src/styles/components/About.scss";
import Link from 'next/link';

import aboutSpartan from "@/src/assets/images/about_spartan.png";
import aboutSammy from "@/src/assets/images/about_sammy.png";

import HeaderTwitter from '@/src/components/svg/HeaderTwitter';
import HeaderInstagram from '@/src/components/svg/HeaderInstagram';
import HeaderGit from '@/src/components/svg/HeaderGit';

export default function AboutPage() {
    const t = useTranslations("about");

    return (
        <section id="about">
            <div className={`window-container free-size`}>
                <section className="window-info-row">
                    <p>{t(`about.title`)}</p>
                </section>
                <p className="about-desc">
                    {t(`about.description`)}
                </p>
            </div>
            <div className={`window-container free-size`}>
                <section className="window-info-row">
                    <p>{t(`team.title`)}</p>
                </section>
                <ul className="team-blocks">
                    <li>
                        <img src={aboutSpartan.src}/>
                        <hgroup>
                            <h3>Spartan</h3>
                            <p>{t(`team.backend`)}</p>
                        </hgroup>
                    </li>
                    <li>
                        <img src={aboutSammy.src}/>
                        <hgroup>
                            <h3>Sammy</h3>
                            <p>{t(`team.frontend`)}</p>
                        </hgroup>
                    </li>
                </ul>
            </div>
            <div className={`window-container free-size`}>
                <section className="window-info-row">
                    <p>{t(`links.title`)}</p>
                </section>
                <ul className="link-blocks">
                <Link className="clickable" target="_blank" href="https://instagram.com/pokesortgame">
                    <HeaderInstagram/>
                    {t(`links.instagram`)}
                </Link>
                <Link className="clickable" target="_blank" href="https://x.com/pokesortgame">
                    <HeaderTwitter/>
                    {t(`links.twitter`)}
                </Link>
                <Link className="clickable" target="_blank" href="https://github.com/pokesort">
                    <HeaderGit/>
                    {t(`links.github`)}
                </Link>
                </ul>
            </div>
            {/* <div className={`window-container free-size`}>
                <section className="window-info-row">
                    <p>{t(`support.title`)}</p>
                </section>                
                <p className="about-desc">
                    {t(`support.description`)}
                </p>
            </div> */}
        </section>
    )
}