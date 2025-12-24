"use client"

import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useState } from 'react';

import '@/src/styles/components/Tutorial.scss';
import Modal from './Modal';
import PageView from './PageView';

import TutorialImage1 from '@/src/assets/images/tutorial_1.gif';
import TutorialImage2 from '@/src/assets/images/tutorial_2.gif';
import TutorialImage3 from '@/src/assets/images/tutorial_3.gif';
import TutorialImage4 from '@/src/assets/images/tutorial_4.gif';
import TutorialImage5 from '@/src/assets/images/tutorial_5.gif';

const tutorialKey = 'u_tutorial';

interface TutorialProps {
    tutorialOpen: boolean,
    setTutorialOpen: React.Dispatch<React.SetStateAction<boolean>>
    pathname: string | null;
}

export default React.memo(function Tutorial({tutorialOpen, setTutorialOpen, pathname}: TutorialProps) {
    const t = useTranslations("tutorial");
    const locale = useLocale().includes('pt') ? 'pt' : 'en';

    useEffect(() => {
        if (!pathname?.includes("puzzle") && !pathname?.includes("daily") && !pathname?.includes("infinite")) return;

        const seenTutorial = localStorage.getItem(tutorialKey);

        if (seenTutorial == null || seenTutorial != "true") {
            setTimeout(() => {
                localStorage.setItem(tutorialKey, "true");
                setTutorialOpen(true);
            }, 300)
        }
    }, [pathname])

    return (
        <>            
            <Modal id="tutorial-modal" title={t(`label`)} isOpen={tutorialOpen} setIsOpen={setTutorialOpen}>
                {tutorialOpen &&
                    <PageView>
                        <li className="tutorial-item">
                            <img src={TutorialImage1.src}/>
                            <p>{t(`text.1`)}</p>
                        </li>
                        <li className="tutorial-item">
                            <img src={TutorialImage2.src}/>
                            <p>{t(`text.2`)}</p>
                        </li>
                        <li className="tutorial-item">
                            <img src={TutorialImage3.src}/>
                            <p>{t(`text.3`)}</p>
                        </li>
                        <li className="tutorial-item">
                            <img src={TutorialImage4.src}/>
                            <p>{t(`text.4`)}</p>
                        </li>
                        <li className="tutorial-item">
                            <img src={TutorialImage5.src}/>
                            <p>{t(`text.5`)}</p>
                        </li>
                    </PageView>
                }
            </Modal>
        </>
    )
});