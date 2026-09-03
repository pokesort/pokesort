import { useLocale, useTranslations } from "use-intl";
import LatestPuzzles from "./LatestPuzzles";
import PokeSprite from "./PokeSprite";
import Link from "next/link";

import StreakIcon from '@/src/components/svg/StreakIcon';
import TickIcon from '@/src/components/svg/TickIcon';
import { useEffect, useRef } from "react";

interface HomeCardProps {
    page: string;
    href: string;
    sprite: string;
    count?: number;
    isNew?: boolean;
}

export default function HomeCard({
    page, href, sprite, count = 0, isNew = false
}: HomeCardProps) {
    const t = useTranslations();
    const locale = useLocale();
    const ref = useRef<HTMLAnchorElement | null>(null);

    let commandAppend = "";
    let extraElement = null;
    let showCommand = true;
    let countIcon = <TickIcon />;

    switch (page) {

        case "daily":
            countIcon = <StreakIcon />
            commandAppend = new Date().toLocaleDateString(locale, {
                day: '2-digit',
                month: 'long'
            });

            useEffect(() => {
                const handleTodayUserData = (e: CustomEventInit<number>) => {
                    ref.current?.setAttribute("data-status", String(e.detail))
                }

                window.addEventListener("today-user-data", handleTodayUserData);
                return () => {
                    window.removeEventListener("today-user-data", handleTodayUserData);
                }
            }, [])
            break;

        case "archive":
            showCommand = false;
            extraElement = (
                <LatestPuzzles limit={7} />
            )
            break;
    }

    return (
        <div className="home-card">
            <h3>
                {t(`header.${page}`)}
                {count > 1 &&
                    <div className="count">
                        {countIcon}
                        <span>{count}</span>
                    </div>
                }
            </h3>

            <p>
                {isNew &&
                    <span className="new-label">
                        {t(`home.new-label`)}
                    </span>
                }
                {t(`home.${page}.description`)}
            </p>

            {extraElement}

            {showCommand &&
                <Link ref={ref} href={href}>
                    {t(`home.${page}.command`)}{commandAppend}
                </Link>
            }

            <PokeSprite slug={`${sprite}.png`} />
        </div>
    )
}