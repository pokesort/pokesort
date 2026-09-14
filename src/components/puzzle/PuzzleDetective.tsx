import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pokemon } from "../../assets/types/PuzzleApiResponse";
import PuzzleTab from "./PuzzleTab";
import { useTranslations } from "use-intl";
import { motion, AnimatePresence, Variants } from 'framer-motion';

import "@/src/styles/components/Puzzle.scss";
import "@/src/styles/components/PuzzleDetective.scss";
import SearchIcon from "../svg/SearchIcon";
import DexIcon from "../svg/DexIcon";
import LogsIcon from "../svg/LogsIcon";
import PuzzleBlock from "./PuzzleBlock";

import ch_sprite from "@/src/assets/images/challenge_d.png";

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1
  }
};

export type PuzzleDetective = {
    pokemons: Pokemon[],
    secretId: number,
    success: true
}

interface PuzzleGridProps {
    pokemons: Pokemon[];
    setCurrentDexView: React.Dispatch<React.SetStateAction<number | undefined>>;
    scrollToTab: (target: number, behavior?: "instant" | "smooth") => void;
}

const PuzzleGrid = ({pokemons, setCurrentDexView, scrollToTab}: PuzzleGridProps) => {
    const [pause, setPause] = useState<boolean>(false);
    const [selectedId, setSelectedId] = useState<number>(0);

    const handleSelect = useCallback((id: number) => {
        if (pause) return;

        selectedId == id ? setSelectedId(0) : setSelectedId(id);
    }, [selectedId, pause]);

    const handlePress = useCallback((id: number) => {
        scrollToTab(2);
        setCurrentDexView(id);
    }, [pause]);

    return (
        <motion.section
            className={`puzzle disable-select cols-5 ${pause ? 'pause' : ''}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence>
                {pokemons.map((p: any, index: number) => {
                    const isSelected = false;
                    const isCorrect = false;
                    const isIncorrect = false;

                    return (
                        <PuzzleBlock
                            key={p.id}
                            pokemon={p}
                            shinies={[]}
                            multiselect={false}
                            isSelected={isSelected}
                            isSolved={false}
                            isCorrect={isCorrect}
                            isIncorrect={isIncorrect}
                            isAvailable={p.available}
                            onSelect={handleSelect}
                            onPress={handlePress}
                        />
                    )
                })}
            </AnimatePresence>
        </motion.section>
    )
}

interface PuzzleDetectiveProps {
    puzzle: PuzzleDetective
}

export default React.memo(function Puzzle({puzzle}: PuzzleDetectiveProps) {
    const t = useTranslations('puzzle');
    
    const [refresh, setRefresh] = useState<boolean>(false);

    const mainTabRef = useRef<HTMLDivElement>(null);
    const [visibleTab, setVisibleTab] = useState<number>(1);
    const [currentDexView, setCurrentDexView] = useState<number>();

    const scrollToTab = useCallback((target: number, behavior: ('smooth' | 'instant') = 'smooth') => {
        if (target !== visibleTab || behavior == 'instant') {
            const tab = document.querySelector(`.puzzle-tab[data-tab="${target}"]`) as HTMLElement;
            if (tab) tab.scrollIntoView({ behavior: behavior, block: 'center' });
        }
    }, [visibleTab])

    const tabsHeight = useMemo(() => {
       return mainTabRef.current?.offsetHeight;
    }, [puzzle, visibleTab, refresh]);

    return (
        <>
            <ul className="puzzle-tabs-container" style={{'--height': `${tabsHeight}px`, '--cols': 5, '--rows': 5} as React.CSSProperties}>
                <PuzzleTab setVisibleTab={setVisibleTab} tab={0}>
                    <div className="window-container cut-left">
                        <section className="window-info-row">
                            <LogsIcon/>
                            <p>{t('logs')}<span>0</span></p>
                        </section>
                        {/* <GuessLogs
                            guesses={guesses}
                            setGuesses={setGuesses}
                            availableTips={availableTips}
                            setAvailableTips={setAvailableTips}
                            spritesMap={spritesMap}
                            allTips={allTips}
                            solvedGroupNames={solvedGroupNames}
                            puzzleRows={puzzle ? puzzle.rows : 4}
                            dictionary={dictionary}
                            viewedTips={viewedTips}
                            abandoned={abandoned}
                            setAbandoned={setAbandoned}
                            logsRef={logsRef}
                        /> */}
                    </div>
                </PuzzleTab>
                <PuzzleTab setVisibleTab={setVisibleTab} tab={1}>
                    <div className="detective-sprite">
                        <img src={ch_sprite.src} />
                    </div>
                    <div className="window-container puzzle-window cut-left" ref={mainTabRef}>
                        <section className="window-info-row">
                            <SearchIcon/>
                            <p>{t(`detective.label`)}</p>
                        </section>
                        <PuzzleGrid
                            pokemons={puzzle.pokemons}
                            setCurrentDexView={setCurrentDexView}
                            scrollToTab={scrollToTab}
                        />
                    </div>
                </PuzzleTab>
                <PuzzleTab setVisibleTab={setVisibleTab} tab={2}>
                    <div className="window-container cut-right">
                        <section className="window-info-row">
                            <DexIcon/>
                            <p>{t('dex')}</p>
                        </section>
                        {/* <DexView pokemonId={currentDexView} /> */}
                    </div>
                </PuzzleTab>
            </ul>
            <nav className="puzzle-tab-nav">
                <button onClick={() => scrollToTab(0)} className={visibleTab == 0 ? 'active' : ''}>
                    {t('logs')}<span>0</span>
                </button>
                <button onClick={() => scrollToTab(1)} className={visibleTab == 1 ? 'active' : ''}>
                    {t('puzzle')}
                </button>
                <button onClick={() => scrollToTab(2)} className={visibleTab == 2 ? 'active' : ''}>
                    {t('dex')}
                </button>
            </nav>
        </>
    )
})