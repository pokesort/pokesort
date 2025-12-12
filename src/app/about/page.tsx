import { useTranslations } from 'next-intl';
import "@/src/styles/components/About.scss";

import aboutSpartan from "@/src/assets/images/about_spartan.png";
import aboutSammy from "@/src/assets/images/about_sammy.png";

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