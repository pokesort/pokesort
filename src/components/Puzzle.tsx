"use client"

import { useTranslations } from 'next-intl';
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocale } from 'next-intl';
import { formatDate, shuffleArray, getNextRefresh } from '@/src/scripts/utils';
import { useInView } from 'react-intersection-observer';
import { redirect } from 'next/navigation';

import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import "@/src/styles/components/Puzzle.scss";
import PokemonBlock from '@/src/components/PuzzleBlock';
import GroupName from '@/src/components/GroupName';
import Modal from '@/src/components/Modal';
import Countdown from '@/src/components/Countdown';
import Loading from '@/src/components/Loading';

import CalendarIcon from '@/src/components/svg/CalendarIcon';
import ShareIcon from '@/src/components/svg/ShareIcon';
import TickIcon from '@/src/components/svg/TickIcon';
import GridIcon from '@/src/components/svg/GridIcon';
import LogsIcon from '@/src/components/svg/LogsIcon';
import DexIcon from '@/src/components/svg/DexIcon';
import helpLogsImage from '@/src/assets/images/help_logs.png';
import DexView from './DexView';
import PokeSprite from './PokeSprite';

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

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
    date: string | undefined,
    victoryOpen: boolean,
    setVictoryOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const VictoryModal = React.memo(({type, guesses, date, victoryOpen, setVictoryOpen}: VictoryModalProps) => {
    const t = useTranslations('puzzle');
    const locale = useLocale();
    const count = 1;
    date = formatDate(date, locale, false);

    const getGuessEmojis = (): string => {
        let output: string = '';
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
        const shareData: ShareData = {
            title: `Meu resultado do Pokesort:`,
            text: getGuessEmojis(),
            url: window.location.href,
        };
        try {            
            if (navigator.canShare(shareData)) {
                navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(shareData.text || window.location.href);
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
                        <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <TickIcon/>
                            Seu {count}º puzzle
                        </p>
                    </div>
                </div>
            }
            <div className="modal-content-div">
                <div className="guesses-container">
                    {guesses.map((guess: PuzzleGuess, index: number) => (
                        <li key={index} className={`guess-${guess.accuracy >= 100 ? '1' : '0'}`}></li>
                    ))}
                </div>
                <div className="guesses-container">
                    <p>Resolvido em <b>{guesses.length}</b> tentativas</p>
                    <button onClick={shareButton} title="Compartilhar">
                        <ShareIcon/>
                    </button>
                </div>
            </div>
            {type == 'daily' ? (
                <>
                <div className="modal-content-div">
                    <p>Próximo puzzle diário em:</p>
                    <h1><Countdown targetDate={getNextRefresh()} active={victoryOpen} /></h1>
                </div>
                <button className="modal-content-div" onClick={ () => redirect('/daily') }>
                    <p>Voltar ao Início</p>
                </button>
                </>
            ) : (
                <button className="modal-content-div" onClick={ () => window.location.reload() }>
                    <p>Gerar Novo Puzzle</p>
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
}

interface GuessLogsInterface {
    guesses: PuzzleGuess[];
}

const GuessLogs = React.memo(({guesses}: GuessLogsInterface) => {
const t = useTranslations('puzzle');

    return (
        <section className="puzzle-guess-logs">
            {guesses.length > 0 ?
                guesses.map((guess: PuzzleGuess, index: number) => (
                    <div key={index} style={{'--accuracy': guess.accuracy} as CSSProperties}
                        className={`puzzle-guess type-${guess.type} ${guess.accuracy == 100 ? 'correct' : ''}`}>
                        <div className="accuracy-circle" title={`${guess.accuracy}% ${t('correct')}`}/>
                        <div className="guess-group">
                            {guess.pokemons.map((pokemon: number) => (
                                <PokeSprite key={pokemon} url={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon}.png`}/>
                            ) )}
                        </div>
                    </div>
                ))
                :
                <div className="tab-help">
                    <img src={helpLogsImage.src}/>
                    <p>{t('help.logs')}</p>
                </div>
            }
        </section>
    )
});

interface PuzzleGridProps {
    puzzle: PuzzleData;
    pause: boolean,
    setPause: (pause: boolean) => void;
    pokemons: any[];
    dictionary: any;
    setGuesses: React.Dispatch<React.SetStateAction<PuzzleGuess[]>>;
    victoryOpen: boolean,
    setVictoryOpen: React.Dispatch<React.SetStateAction<boolean>>
    setCurrentDexView: React.Dispatch<React.SetStateAction<number | undefined>>;
    scrollToTab: (target: number, behavior?: "instant" | "smooth") => void;
}

const PuzzleGrid = React.memo(({puzzle, pause, setPause, pokemons, dictionary, setGuesses, victoryOpen, setVictoryOpen, setCurrentDexView, scrollToTab}: PuzzleGridProps) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [groupSets, setGroupSets] = useState<Set<number>[]>([]);
    const [incorrectGuessIds, setIncorrectGuessIds] = useState<Set<number>>(new Set());
    const [correctGuessIds, setCorrectGuessIds] = useState<Set<number>>(new Set());
    const [solvedGroupIds, setSolvedGroupIds] = useState<Set<number>>(new Set());
    const [solvedInOrder, setSolvedInOrder] = useState<any[]>([]);
    const [solvedGroupNames, setSolvedGroupNames] = useState<string[]>([]);

    useEffect(() => {
        let groupArray: Set<number>[] = [];

        for (let i = 0; i < puzzle.groups.length; i++) {
            groupArray[i] = new Set(puzzle.groups[i].pokemons);
        }

        setGroupSets(groupArray);
    }, [puzzle]);

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
        setGuesses((prev: PuzzleGuess[]) => [...prev, guess]);
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
                    markGroupAsSolved(selectedIds);
                    if (guess.group != null)
                        solvedGroupNames.push(puzzle.groups[guess.group].query);
                    setSelectedIds(new Set());
                    if (solvedGroupNames.length == puzzle.rows) {
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
    const mainTabRef = useRef<HTMLDivElement>(null);

    const [refresh, setRefresh] = useState<boolean>(false);
    const [pause, setPause] = useState<boolean>(false);
    const [guesses, setGuesses] = useState<PuzzleGuess[]>([]);
    const [pokemons, setPokemons] = useState<any>([]);
    const [victoryOpen, setVictoryOpen] = useState<boolean>(false);
    const [mountVictoryModal, setMountVictoryModal] = useState<boolean>(false);
    const [visibleTab, setVisibleTab] = useState<number>(1);
    const [currentDexView, setCurrentDexView] = useState<number>();

    useEffect(() => {
        if (dictionary) setPokemons(shuffleArray(dictionary.pokemons));
    }, [dictionary]);

    useEffect(() => {
        setMountVictoryModal(true);
    }, [victoryOpen]);

    useEffect(() => {
        setGuesses([]);
        scrollToTab(1, 'instant');
        setTimeout(() => {
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

    return (
        <>
            {mountVictoryModal &&
                <VictoryModal type={type} guesses={guesses} date={puzzle?.date} victoryOpen={victoryOpen} setVictoryOpen={setVictoryOpen} />
            }
            <ul className="puzzle-tabs-container" style={{'--height': `${tabsHeight}px`, '--cols': puzzle ? puzzle.cols : 4, '--rows': puzzle ? puzzle.rows : 4} as React.CSSProperties}>
                {puzzle ?
                <PuzzleTab setVisibleTab={setVisibleTab} tab={0}>
                    <div className="window-container cut-left">
                        <section className="window-info-row">
                            <LogsIcon/>
                            <p>{t('logs')}<span>{guesses.length}</span></p>
                        </section>
                        <GuessLogs guesses={guesses} />
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
                                dictionary={dictionary}
                                setGuesses={setGuesses}
                                victoryOpen={victoryOpen}
                                setVictoryOpen={setVictoryOpen}
                                setCurrentDexView={setCurrentDexView}
                                scrollToTab={scrollToTab}
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