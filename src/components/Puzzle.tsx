"use client"

import { useTranslations } from 'next-intl';
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocale } from 'next-intl';
import { formatDate, isYesterday, shuffleArray, getNextRefresh, toTitleCase, decodeTips, randomInRange, isMobile } from '@/src/scripts/utils';
import { useInView } from 'react-intersection-observer';
import { redirect } from 'next/navigation';

import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import "@/src/styles/components/Puzzle.scss";
import PokemonBlock from '@/src/components/PuzzleBlock';
import { GroupName, getNaturalGroupnames } from '@/src/components/GroupName';
import Modal from '@/src/components/Modal';
import Countdown from '@/src/components/Countdown';
import Loading from '@/src/components/Loading';

import CalendarIcon from '@/src/components/svg/CalendarIcon';
import ShareIcon from '@/src/components/svg/ShareIcon';
import StreakIcon from '@/src/components/svg/StreakIcon';
import GridIcon from '@/src/components/svg/GridIcon';
import LogsIcon from '@/src/components/svg/LogsIcon';
import DexIcon from '@/src/components/svg/DexIcon';
import helpLogsImage from '@/src/assets/images/help_logs.png';
import DexView from './DexView';
import PokeSprite from './PokeSprite';

const streakKey = 'u_dailystreak';

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const recordStreak = (today: string) => {
    const streak = localStorage.getItem(streakKey) || '';

    let streakObj = streak != '' ? JSON.parse(streak) : {latest: '', streak: 0};
    if (isYesterday(streakObj.latest, today)) {
        streakObj.streak += 1;
    } else {
        streakObj.streak = 1;
    }
    streakObj.latest = today;

    localStorage.setItem(streakKey, JSON.stringify(streakObj));
}

interface SolvedGroupsGridProps {
    groups: string[];
    dictionary: any;
}

const SolvedGroupsGrid = ({groups, dictionary}: SolvedGroupsGridProps) => {
    return (
        <section className="solved-groups-grid">
            
            {groups.map((group: string, index: number)=> (
                <div key={group} className="solved-group">
                    <GroupName query={group} dictionary={dictionary}/>
                </div>
            ))}
        </section>
    )
}

interface VictoryModalProps {
    type: 'daily' | 'infinite',
    guesses: PuzzleGuess[],
    shinies: number[];
    dateOg: string | undefined,
    victoryOpen: boolean,
    setVictoryOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const VictoryModal = React.memo(({type, guesses, shinies, dateOg, victoryOpen, setVictoryOpen}: VictoryModalProps) => {
    const t = useTranslations('puzzle');
    const locale = useLocale();
    const date = formatDate(dateOg, locale, false);
    const realGUesses = guesses.filter((g: PuzzleGuess) => g.type != 1);

    const [streak, setStreak] = useState<number>(1);
    const [isCopied, setIsCopied] = useState<'share' | 'copy' | 'done'>(isMobile() ? 'share' : 'copy');

    useEffect(() => {
        const streakData = localStorage.getItem(streakKey);
        if (streakData != null) setStreak(JSON.parse(streakData).streak);
    }, [victoryOpen])

    const getGuessEmojis = (): string => {
        let output: string = '';
        shinies.forEach(() => {
            output += "✨"
        })
        guesses.forEach(guess => {
            if (guess.accuracy >= 100) { // correct
                output += "🟩"
            } else if (guess.type == 0) { // incorrect
                output += "🟥"
            } else { // hint
                output += "🟨"
            }
        })
        return output;
    }

    const shareButton = () => {
        const url = window.location.href;
        const emojis = getGuessEmojis();
        let text = `Pokesort · ${type == 'daily' ? formatDate(dateOg, locale, false) : t('puzzle.infinite')}`
        if (type == 'daily' && streak > 1) {
            text += ` · 🔥${streak}`
        }
        
        const shareData: ShareData = {
            text: `${text}\n${emojis}\n${url}`,
        };
        try {
            if (isMobile()) {
                navigator.share(shareData);
            } else {
                setIsCopied('done');
                navigator.clipboard.writeText(shareData.text || window.location.href);
                setTimeout(() => {
                    setIsCopied('copy');
                }, 1000);
            }
        } catch (error) {
            console.error("Não foi possível compartilhar. O problema talvez seja pela falta de uma conexão segura (HTTPS)");
        }
    }
    
    return (
        <Modal id="victory-modal" title="Gotcha!" isOpen={victoryOpen} setIsOpen={setVictoryOpen}>
            <>
            {type == 'daily' &&
                <div style={{display: 'flex', gap: 'inherit'}}>
                    {date &&
                        <div className="modal-content-div">
                            <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <CalendarIcon/>{date}
                            </p>
                        </div>
                    }
                    <div className="modal-content-div">
                        <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}} title={t(`victory.streak-desc`)}>
                            <StreakIcon/>
                            {t(`victory.streak`)}: {streak}
                        </p>
                    </div>
                </div>
            }
            {shinies.length > 0 &&
                <div className="modal-content-div">
                    <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        {t(`victory.shinies`)} <b>{shinies.length}</b> {shinies.length > 1 ? 'Shinies' : 'Shiny'}!
                    </p>                    
                </div>
            }
            <div className="modal-content-div">
                <div className="guesses-container">
                    {guesses.map((guess: PuzzleGuess, index: number) => (
                        <li key={index} className={`guess-${guess.accuracy >= 100 ? '1' : '0'} ${guess.type == 1 ? 'guess-2' : ''}`}></li>
                    ))}
                </div>
                <div className="guesses-container">
                    <p>{t(`victory.attempts-1`)}<b>{realGUesses.length}</b>{t(`victory.attempts-2`)}</p>
                    <button onClick={shareButton} title={t(`victory.share`)}>
                        <ShareIcon mode={isCopied}/>
                    </button>
                </div>
            </div>
            {type == 'daily' ? (
                <>
                <div className="modal-content-div">
                    <p>{t(`victory.next-daily`)}:</p>
                    <h1><Countdown targetDate={getNextRefresh()} active={victoryOpen} /></h1>
                </div>
                <button className="modal-content-div" onClick={ () => redirect('/') }>
                    <p>{t(`victory.back`)}</p>
                </button>
                </>
            ) : (
                <button className="modal-content-div" onClick={ () => window.location.reload() }>
                    <p>{t(`victory.generate`)}</p>
                </button>
            )}
            </>
        </Modal>
    )
})

interface PuzzleTabProps {
    setVisibleTab: React.Dispatch<React.SetStateAction<number>>;
    tab: number;
    children?: React.ReactNode;
}

const PuzzleTab = React.memo(({setVisibleTab, children, tab}: PuzzleTabProps) => {
    const { ref: viewRef, inView } = useInView({ threshold: 0.1 });

    useEffect(() => {
        if (inView) {
            setVisibleTab(tab);
        }
    }, [inView, tab]);
    
    return (
        <li ref={viewRef} className="puzzle-tab" data-tab={tab}>
            {children}
        </li>
    )
})

type PuzzleGuess = {
    type: 0 | 1 | 2; // guess | hint | dex
    accuracy: number;
    pokemons: number[];
    group: number | null;
    tip: number | null;
}

type PuzzleTip = {
    group: string;
    tip: string;
}

interface GuessLogsInterface {
    guesses: PuzzleGuess[];
    setGuesses: React.Dispatch<React.SetStateAction<PuzzleGuess[]>>;
    availableTips: number;
    setAvailableTips: React.Dispatch<React.SetStateAction<number>>;
    spritesMap:  React.RefObject<Record<number, string>>;
    allTips: React.RefObject<PuzzleTip[]>;
    solvedGroupNames: string[];    
    dictionary: any;
    viewedTips: React.RefObject<number[]>;
}

const GuessLogs = React.memo(({guesses, setGuesses, availableTips, setAvailableTips, spritesMap, allTips, solvedGroupNames, dictionary, viewedTips}: GuessLogsInterface) => {
    const t = useTranslations('');

    const askForTip = () => {        
        if (availableTips <= 0 || viewedTips.current.length == allTips.current.length) return;

        const logs = document.querySelector('.puzzle-guess-logs');

        let guess: PuzzleGuess = {
            type: 1,
            accuracy: 0,
            pokemons: [],
            group: null,
            tip: null
        };
        let tip: PuzzleTip | null = null;

        while (!tip) {
            const index = Math.floor(Math.random() * allTips.current.length);
            const possibleTip: PuzzleTip = allTips.current[index];
            if (!viewedTips.current.includes(index) && !solvedGroupNames.includes(possibleTip.group)) {
                tip = possibleTip;
                guess.tip = index;
                viewedTips.current.push(index);
            }
        }

        logs?.scrollBy({
            top: logs.scrollHeight,
            behavior: "smooth",
        });
        setAvailableTips(prev => prev-1);
        setGuesses((prev: PuzzleGuess[]) => [...prev, guess]);
    }

    const renderTip = (allTips: React.RefObject<PuzzleTip[]>, tipIndex: number) => {
        const tip: any = decodeTips(allTips.current[tipIndex].tip);

        if (tip.type == 'pair') {
            return (
                <p className="tip">
                    {tip.values.map((mon: string[], monIndex: number) => (
                        <span key={monIndex}>
                            <b>{toTitleCase(mon)}</b>
                            {monIndex < tip.values.length-2 ? <>, </> : <></>}
                            {monIndex == tip.values.length-2 ? <> {t(`puzzle.tips.and`)} </> : <></>}
                        </span>
                    ))}
                    <> {t(`puzzle.tips.${tip.type}`)}</>
                </p>
            )
        } else {
            return (
                <p className="tip">
                    {t(`puzzle.tips.${tip.type}`)} <b>{getNaturalGroupnames(tip.values, dictionary, t).join('  ·  ')}</b>
                </p>
            )
        }        
    }

    return (
        <>
            {guesses.length > 0 && allTips.current.length > 0 &&
                <button className="ask-tip" onClick={askForTip} data-tips={availableTips}>{t(`puzzle.tips.ask`)} <span>x{availableTips}</span></button>
            }
            <section className="puzzle-guess-logs">
                {guesses.length > 0 ?
                    <>                    
                        {guesses.map((guess: PuzzleGuess, index: number) => (
                            <div key={index} style={{'--accuracy': guess.accuracy} as CSSProperties}
                                className={`puzzle-guess type-${guess.type} ${guess.accuracy == 100 ? 'correct' : ''}`}>
                                <div className="accuracy-circle" title={`${guess.accuracy}% ${t('puzzle.correct')}`}/>
                                <div className="guess-group">
                                    {guess.tip != null &&
                                        <>{renderTip(allTips, guess.tip)}</>
                                    }
                                    {guess.pokemons.map((pokemon: number) => (
                                        <PokeSprite key={pokemon} slug={spritesMap.current[pokemon]}/>
                                    ) )}
                                </div>
                            </div>
                        ))}
                    </>
                    :
                    <div className="tab-help">
                        <img src={helpLogsImage.src}/>
                        <p>{t('puzzle.help.logs')}</p>
                    </div>
                }
            </section>
        </>
    )
});

interface PuzzleGridProps {
    puzzle: PuzzleData;
    pause: boolean,
    setPause: (pause: boolean) => void;
    pokemons: any[];
    shinies: number[];
    dictionary: any;
    setGuesses: React.Dispatch<React.SetStateAction<PuzzleGuess[]>>;
    forcedGuesses?: PuzzleGuess[];
    victoryOpen: boolean,
    setVictoryOpen: React.Dispatch<React.SetStateAction<boolean>>
    setCurrentDexView: React.Dispatch<React.SetStateAction<number | undefined>>;
    scrollToTab: (target: number, behavior?: "instant" | "smooth") => void;
    solvedGroupNames: string[];
    resetAvailableTips: () => void;
}

const PuzzleGrid = React.memo(({puzzle, pause, setPause, pokemons, shinies, dictionary, setGuesses, forcedGuesses=[], victoryOpen, setVictoryOpen, setCurrentDexView, scrollToTab, solvedGroupNames, resetAvailableTips}: PuzzleGridProps) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [groupSets, setGroupSets] = useState<Set<number>[]>([]);
    const [incorrectGuessIds, setIncorrectGuessIds] = useState<Set<number>>(new Set());
    const [correctGuessIds, setCorrectGuessIds] = useState<Set<number>>(new Set());
    const [solvedGroupIds, setSolvedGroupIds] = useState<Set<number>>(new Set());
    const [solvedInOrder, setSolvedInOrder] = useState<any[]>([]);

    useEffect(() => {
        let groupArray: Set<number>[] = [];

        for (let i = 0; i < puzzle.groups.length; i++) {
            groupArray[i] = new Set(puzzle.groups[i].pokemons);
        }

        setGroupSets(groupArray);
    }, [puzzle]);

    useEffect(() => {
        if (forcedGuesses.length > 0 && solvedGroupNames.length == 0) {
            forcedGuesses.forEach((guess: PuzzleGuess) => {
                setCorrectGuessIds(new Set(guess.pokemons));
                markGroupAsSolved(new Set(guess.pokemons));
                if (guess.group != null) solvedGroupNames.push(puzzle.groups[guess.group].query);
            })
        }
    }, [forcedGuesses]);

    const handleSelect = useCallback((id: number) => {
        if (pause) return;

        setSelectedIds(prevSet => {
            const newSet = new Set(prevSet);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, [pause]);

    const handlePress = useCallback((id: number) => {
        scrollToTab(2);
        setCurrentDexView(id);
    }, [pause]);

    const compareGroups = useCallback((selected: Set<number>): PuzzleGuess | null => {
        if (!puzzle || !puzzle.groups) return null;

        let accuracy = 0;
        let guess = {
            type: 0,
            accuracy: 0,
            pokemons: Array.from(selected),
            group: null
        } as PuzzleGuess;

        for (let i = 0; i < puzzle.groups.length; i++) {
            if (solvedGroupIds.has(puzzle.groups[i].pokemons[0])) continue;

            for(const [index, group] of groupSets.entries()) {      
                let innerAccuracy = 0;
                
                if (selected.size !== group.size) continue;
                for (let element of selected) {
                    if (group.has(element)) innerAccuracy += 1;
                }

                if (innerAccuracy > accuracy) accuracy = innerAccuracy;

                if (innerAccuracy == group.size) {
                    guess.group = index;
                    break;
                }
            }
        }

        guess.accuracy = Math.round((accuracy * 100) / selected.size);
        return guess;

    }, [puzzle, solvedGroupIds, groupSets]);

    const handleGuess = useCallback((guess: PuzzleGuess) => {
        setTimeout(() => {
            setGuesses((prev: PuzzleGuess[]) => [...prev, guess]);
        }, 1000);
    }, []);

    const markGroupAsSolved = useCallback((newlySolvedIds: Set<number>) => {
        const newSolvedGroup = pokemons.filter((p:any) => newlySolvedIds.has(p.id));

        setSolvedInOrder(prevOrder => [...prevOrder, ...newSolvedGroup]);
        setSolvedGroupIds(prevIds => new Set([...prevIds, ...newlySolvedIds]));
    }, [pokemons]);

    useEffect(() => {
        if (!puzzle?.cols || selectedIds.size < puzzle.cols) {
            return;
        }

        const makeGuess = () => {
            setPause(true);
            const guess = compareGroups(selectedIds);

            if (!guess) return;
            const logs = document.querySelector('.puzzle-guess-logs');
            handleGuess(guess);
            
            if (guess.accuracy >= 100) {
                setCorrectGuessIds(selectedIds);
                setTimeout(() => {
                    resetAvailableTips();
                    markGroupAsSolved(selectedIds);
                    if (guess.group != null)
                        solvedGroupNames.push(puzzle.groups[guess.group].query);
                    setSelectedIds(new Set());
                    if (solvedGroupNames.length == puzzle.rows) {
                        if (puzzle.daily) recordStreak(puzzle.date);
                        setTimeout(() => {
                            setVictoryOpen(true);
                        }, 1600);
                    }
                    logs?.scrollBy({
                        top: logs.scrollHeight,
                        behavior: "smooth",
                    });
                    setPause(false);
                }, 800);
            } else {
                setIncorrectGuessIds(selectedIds);                
                setTimeout(() => {
                    setSelectedIds(new Set());
                    setIncorrectGuessIds(new Set());
                    logs?.scrollBy({
                        top: logs.scrollHeight,
                        behavior: "smooth",
                    });
                    setPause(false);
                }, 800);
            }
        };

        makeGuess();
    }, [selectedIds, puzzle, compareGroups, markGroupAsSolved, handleGuess]);   

    const activePokemons = useMemo(() => pokemons.filter((p:any) => !solvedGroupIds.has(p.id)), [pokemons, solvedGroupIds]);

    return (
        <motion.section
            className={`puzzle disable-select cols-${puzzle.cols} ${pause ? 'pause' : ''}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <SolvedGroupsGrid groups={solvedGroupNames} dictionary={dictionary}/>
            <AnimatePresence>

                {solvedInOrder.map((p: any, index: number) => {
                    const isSelected = selectedIds.has(p.id);
                    const isCorrect = solvedGroupIds.has(p.id) || correctGuessIds.has(p.id);
                    const isIncorrect = incorrectGuessIds.has(p.id);

                    return (
                        <PokemonBlock
                            key={p.id}
                            pokemon={p}
                            shinies={shinies}
                            multiselect={true}
                            isSelected={isSelected}
                            isSolved={true}
                            isCorrect={isCorrect}
                            isIncorrect={isIncorrect}
                            onSelect={handleSelect}
                            onPress={handlePress}
                        />
                    )
                })}
                {activePokemons.map((p: any, index: number) => {
                    const isSelected = selectedIds.has(p.id);
                    const isCorrect = solvedGroupIds.has(p.id) || correctGuessIds.has(p.id);
                    const isIncorrect = incorrectGuessIds.has(p.id);

                    return (
                        <PokemonBlock
                            key={p.id}
                            pokemon={p}
                            shinies={shinies}
                            multiselect={true}
                            isSelected={isSelected}
                            isSolved={false}
                            isCorrect={isCorrect}
                            isIncorrect={isIncorrect}
                            onSelect={handleSelect}
                            onPress={handlePress}
                        />
                    )
                })}
            </AnimatePresence>
        </motion.section>
    )
})

interface PuzzleProps {
    puzzle: PuzzleData | undefined;
    setPuzzle: (puzzle: PuzzleData) => void;
    type: 'daily' | 'infinite';
    dictionary: any;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
}

export default React.memo(function Puzzle({puzzle, setPuzzle, type, dictionary, loading, setLoading, error, setError}: PuzzleProps) {
    const t = useTranslations('puzzle');
    const locale = useLocale();
    const maxAvailableTips = 2;

    const mainTabRef = useRef<HTMLDivElement>(null);
    const spritesMap = useRef<Record<number, string>>({});
    const allTips = useRef<PuzzleTip[]>([]);
    const viewedTips = useRef<number[]>([]);
    const loaded = useRef<boolean | null>(null);

    const saveState = (id: string) => {
        if (id == '') return;
        let status = 0;
        if (guesses.filter((g: PuzzleGuess) => g.accuracy >= 100).length == puzzle?.rows)
            status = 1;
        const state = {
            status,
            guesses,
            tips: {uses: availableTips, seen: viewedTips.current},
            shiny: shinies
        };

        localStorage.setItem(`s_${id}`, JSON.stringify(state));
    }

    const loadState = (id: string) => {
        const data = localStorage.getItem(`s_${id}`);
        if (!data) {
            setGuesses([]);
            return false;
        }

        const state = JSON.parse(data);
        if (process.env.NODE_ENV === "development") {
            console.log(`Estado carregado para puzzle ${id}`);
        }
        if (state.guesses != undefined) {
            setGuesses(state.guesses);
            setForcedGuesses(state.guesses.filter((g: PuzzleGuess) => g.accuracy >= 100));
        }
        if (state.tips.uses != undefined) {
            setAvailableTips(state.tips.uses);
            viewedTips.current = state.tips.seen;
        }
        if (state.shiny != undefined) {
            setShinies(state.shiny);
        }
        if (state.status > 0) {
            setTimeout(() => {
                setVictoryOpen(true);
            }, 1000);
        }

        return true;

    }
    
    const [guesses, setGuesses] = useState<PuzzleGuess[]>([]);
    const [forcedGuesses, setForcedGuesses] = useState<PuzzleGuess[]>([]);
    const [availableTips, setAvailableTips] = useState<number>(maxAvailableTips);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [pause, setPause] = useState<boolean>(false);
    const [pokemons, setPokemons] = useState<any>([]);
    const [shinies, setShinies] = useState<number[]>([]);
    const [victoryOpen, setVictoryOpen] = useState<boolean>(false);
    const [customGroupsOpen, setCustomGroupsOpen] = useState<boolean>(false);
    const [mountVictoryModal, setMountVictoryModal] = useState<boolean>(false);
    const [visibleTab, setVisibleTab] = useState<number>(1);
    const [currentDexView, setCurrentDexView] = useState<number>();
    const [solvedGroupNames, setSolvedGroupNames] = useState<string[]>([]);

    useEffect(() => {
        if (dictionary) {
            allTips.current = dictionary.tips;
            setPokemons(shuffleArray(dictionary.pokemons));
            dictionary.pokemons.forEach((p: any) => {
                spritesMap.current[p.id] = p.sprite_default;
            })
        }
    }, [dictionary]);

    useEffect(() => {
        setMountVictoryModal(true);
    }, [victoryOpen]);

    useEffect(() => {
        if (puzzle && guesses.length > 0) saveState(puzzle._id || '');
    }, [guesses])

    useEffect(() => {
        if (puzzle && type != 'infinite') {
            loaded.current = loadState(puzzle._id || '');
        } else {
            loaded.current = false;
        }
        scrollToTab(1, 'instant');
        setTimeout(() => {
            setLoading(false);
            setRefresh(prev => !prev);
        }, 0);
    }, [puzzle])    

    useEffect(() => {
        const handleResize = () => {
            scrollToTab(1, 'instant');
            setRefresh(prev => !prev);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        const randomShinies = () => {
            const mons = pokemons.map((mon: any) => mon.dex_number);
            for (let i = 1; i <= 3; i++) {
                const chance = randomInRange(1, 30);
                if (chance == 1) {
                    const shinyTarget = randomInRange(0, mons.length);
                    setShinies((prev) => [...prev, mons[shinyTarget]]);
                }
            }
        }

        if (loaded.current == false)
            randomShinies();
    }, [pokemons])    

    const scrollToTab = (target: number, behavior: ('smooth' | 'instant') = 'smooth') => {
        if (target !== visibleTab) {
            const tab = document.querySelector(`.puzzle-tab[data-tab="${target}"]`) as HTMLElement;
            if (tab) tab.scrollIntoView({ behavior: behavior, block: 'center' });
        }
    }

    const tabsHeight = useMemo(() => {
       return mainTabRef.current?.offsetHeight;
    }, [puzzle, visibleTab, refresh]);

    const date = useMemo(() => {
        if (type == 'infinite') {
            return t('infinite')
        } else {
            return puzzle?.date ? formatDate(puzzle.date, locale) : '';
        }
    }, [puzzle]);

    const hasCustomGroups = useMemo(() => {
        let output = false;

        puzzle?.groups.forEach((group: any) => {
            output = output || !group.query.includes('?');
        });
        if (output) setCustomGroupsOpen(true);

        return output;
    }, [puzzle, mountVictoryModal]);

    const resetAvailableAttempts = () => {
        setAvailableTips(maxAvailableTips);
    }

    return (
        <>
            {hasCustomGroups &&
                <Modal id="custom-groups-modal" isOpen={customGroupsOpen} canClose={false} setIsOpen={setCustomGroupsOpen}>
                    <>
                        <div className="modal-content-div">
                            <p>{t(`custom-groups-1`)}</p>
                            <p>{t(`custom-groups-2`)}</p>
                        </div>
                        <button className="modal-content-div" onClick={() => setCustomGroupsOpen(false)}>
                            <p>{t(`okay`)}</p>
                        </button>
                    </>
                </Modal>
            }
            {mountVictoryModal &&
                <VictoryModal
                    type={type}
                    guesses={guesses}
                    shinies={shinies}
                    dateOg={puzzle?.date}
                    victoryOpen={victoryOpen}
                    setVictoryOpen={setVictoryOpen} />
            }
            <ul className="puzzle-tabs-container" style={{'--height': `${tabsHeight}px`, '--cols': puzzle ? puzzle.cols : 4, '--rows': puzzle ? puzzle.rows : 4} as React.CSSProperties}>
                {puzzle ?
                <PuzzleTab setVisibleTab={setVisibleTab} tab={0}>
                    <div className="window-container cut-left">
                        <section className="window-info-row">
                            <LogsIcon/>
                            <p>{t('logs')}<span>{guesses.length}</span></p>
                        </section>
                        <GuessLogs
                            guesses={guesses}
                            setGuesses={setGuesses}
                            availableTips={availableTips}
                            setAvailableTips={setAvailableTips}
                            spritesMap={spritesMap}
                            allTips={allTips}
                            solvedGroupNames={solvedGroupNames}
                            dictionary={dictionary}
                            viewedTips={viewedTips}
                        />
                    </div>
                </PuzzleTab> : <div></div>}
                <PuzzleTab setVisibleTab={setVisibleTab} tab={1}>
                    <div className="window-container puzzle-window cut-left" ref={mainTabRef}>
                        <section className="window-info-row">
                            {!loading && <>
                                <GridIcon/>
                                <p>{t('puzzle')}{date ? <span>{date}</span> : <></>}</p>
                            </>}
                        </section>
                        {loading || !puzzle ? (
                            <Loading expand={true} />
                        ): (
                            <PuzzleGrid
                                puzzle={puzzle}
                                pause={pause}
                                setPause={setPause}
                                pokemons={pokemons}
                                shinies={shinies}
                                dictionary={dictionary}
                                setGuesses={setGuesses}
                                forcedGuesses={forcedGuesses}
                                victoryOpen={victoryOpen}
                                setVictoryOpen={setVictoryOpen}
                                setCurrentDexView={setCurrentDexView}
                                scrollToTab={scrollToTab}
                                solvedGroupNames={solvedGroupNames}
                                resetAvailableTips={resetAvailableAttempts}
                            />
                        )}
                    </div>
                </PuzzleTab>
                {puzzle && <PuzzleTab setVisibleTab={setVisibleTab} tab={2}>
                    <div className="window-container cut-right">
                        <section className="window-info-row">
                            <DexIcon/>
                            <p>{t('dex')}</p>
                        </section>
                        <DexView pokemonId={currentDexView} />
                    </div>
                </PuzzleTab>}
            </ul>
            {puzzle &&
            <nav className="puzzle-tab-nav">
                <button onClick={() => scrollToTab(0)} className={visibleTab == 0 ? 'active' : ''}>
                    {t('logs')}<span>{guesses.length}</span>
                </button>
                <button onClick={() => scrollToTab(1)} className={visibleTab == 1 ? 'active' : ''}>
                    {t('puzzle')}
                </button>
                <button onClick={() => scrollToTab(2)} className={visibleTab == 2 ? 'active' : ''}>
                    {t('dex')}
                </button>
            </nav>}
        </>
    )
})