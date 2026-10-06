import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pokemon } from "../../assets/types/PuzzleApiResponse";
import PuzzleTab from "./PuzzleTab";
import { useLocale, useTranslations } from "use-intl";
import { motion, AnimatePresence, Variants } from 'framer-motion';

import "@/src/styles/components/Puzzle.scss";
import "@/src/styles/components/PuzzleDetective.scss";
import SearchIcon from "../svg/SearchIcon";
import DexIcon from "../svg/DexIcon";
import LogsIcon from "../svg/LogsIcon";
import PuzzleBlock from "./PuzzleBlock";

import helpLogsImage from '@/src/assets/images/help_logs.png';
import ch_sprite from "@/src/assets/images/challenge_d.png";
import DexView from "../DexView";
import AbandonIcon from "../svg/AbandonIcon";
import Modal from "../Modal";
import QueryFilter, { QueryFilterValue } from "../forms/QueryFilter";
import { form } from "framer-motion/client";
import { useRouter } from "next/navigation";
import { formatDate, isMobile, queryToObject } from "@/src/scripts/utils";
import TickIcon from "../svg/TickIcon";
import ShareIcon from "../svg/ShareIcon";
import PokeSprite from "../PokeSprite";
import { scrollGuessLogs } from "./Puzzle";
import GridIcon from "../svg/GridIcon";
import { getNaturalGroupnames } from "../GroupName";

const detectiveCount = 'u_detectivecount';

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1
  }
};

const recordDetectiveCount = () => {
    const streak = localStorage.getItem(detectiveCount) || '0';
    const newStreak = parseInt(streak) + 1;

    localStorage.setItem(detectiveCount, JSON.stringify(newStreak));
}

export type PuzzleDetective = {
    pokemons: Pokemon[],
    secretId: number,
    usedProperties: string[],
    success: true,
    guess_limit: 0 | 5 | 1,
}

type PuzzleGuess = {
    type: 0 | 1; // guess | question
    pokemons?: number[];
    query: string | null;
    answer: boolean;
}

interface VictoryModalProps {
    guesses: PuzzleGuess[],
    victoryOpen: boolean;
    setVictoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
    abandoned: boolean;
    refreshPuzzle?: () => void;
}

const VictoryModal = React.memo(({guesses, victoryOpen, setVictoryOpen, refreshPuzzle, abandoned}: VictoryModalProps) => {
    const t = useTranslations('puzzle');
    const router = useRouter();
    const realGuesses = guesses.filter((g: PuzzleGuess) => g.type != 1);

    const [streak, setStreak] = useState<number>(1);
    const [isCopied, setIsCopied] = useState<'share' | 'copy' | 'done'>(isMobile() ? 'share' : 'copy');

    useEffect(() => {
        const streakData = localStorage.getItem(detectiveCount);
        if (streakData != null) setStreak(JSON.parse(streakData));
    }, [victoryOpen])

    const getGuessEmojis = (): string => {
        let output: string = '';
        guesses.forEach(guess => {
            if (guess.type == 1) { // question
                output += "🟨"
            } else if (guess.answer) { // correct guess
                output += "🟩"
            } else { // incorrect guess
                output += "🟥"
            }
        })
        return output;
    }

    const shareButton = () => {
        let queries: string = "";
        const url = window.location.href.split("?")[0];
        const emojis = getGuessEmojis();
        let text = `Pokesort · ${t('detective.label')}`
        
        const shareData: ShareData = {
            text: `${text}\n${emojis}\n${url+queries}`,
        };
        try {
            if (isMobile() && navigator.share) {
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
        <Modal
            id="victory-modal"
            title={!abandoned ? t(`victory.win`) : t(`victory.lose`)}
            isOpen={victoryOpen} setIsOpen={setVictoryOpen}
        >
            <>
            <div className="modal-content-div">
                <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <TickIcon/>
                    {t(`victory.detective-count`)}: {streak}
                </p>
            </div>
            <div className="modal-content-div">
                <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    {t(`victory.questions-1`)}
                    <b>{guesses.length - realGuesses.length}</b>
                    {t(`victory.questions-2`)}
                </p>
            </div>
            <div className="modal-content-div">
                <div className="guesses-container">
                    {realGuesses.map((guess: PuzzleGuess, index: number) => (
                        <li key={index} className={`guess-${guess.answer ? '1' : '0'}`}></li>
                    ))}
                </div>
                <div className="guesses-container">
                    <p>
                        {!abandoned ? t(`victory.attempts-1`) : t(`victory.attempts-1-l`)}
                        <b>{realGuesses.length}</b>
                        {t(`victory.attempts-2`)}
                    </p>
                    {!abandoned &&
                        <button onClick={shareButton} title={t(`victory.share`)}>
                            <ShareIcon mode={isCopied}/>
                        </button>
                    }
                </div>
            </div>
                {refreshPuzzle &&
                    <button className="modal-content-div" onClick={ () => {refreshPuzzle(); setVictoryOpen(false)} }>
                        <p>{t(`victory.generate`)}</p>
                    </button>
                }
                <button className="modal-content-div" onClick={ () => router.push('/') }>
                    <p>{t(`victory.back`)}</p>
                </button>
            </>
        </Modal>
    )
})

interface GuessLogsProps {
    guesses: PuzzleGuess[];
    dictionary: any;
    setQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    abandonPuzzle: () => void;
    isSolved: boolean;
    logsRef: React.RefObject<HTMLElement | null>;
    spritesMap:  React.RefObject<Record<number, string>>;
}

const GuessLogs = React.memo(({guesses, dictionary, setQuestionModalOpen, abandonPuzzle, isSolved, logsRef, spritesMap}: GuessLogsProps) => {
    const t = useTranslations('');
    const locale = useLocale();
    const [showAbandonModal, setShowAbandonModal] = useState<boolean>(false);

    return (
        <>
            <Modal id={"puzzle-abandon"} isOpen={showAbandonModal} setIsOpen={setShowAbandonModal} canClose={true} background={true}>
                <div className="modal-content-div">
                    <p>
                        {t(`puzzle.abandon.confirmation-1`)}
                    </p>
                    <p>
                        {t(`puzzle.abandon.confirmation-2`)}
                    </p>
                </div>
                <div className="button-row">
                    <button className="modal-content-div" onClick={() => setShowAbandonModal(false)}>
                        <p>{t(`puzzle.abandon.no`)}</p>
                    </button>
                    <button className="modal-content-div" onClick={() => {setShowAbandonModal(false); abandonPuzzle()}}>
                        <p>{t(`puzzle.abandon.yes`)}</p>
                    </button>
                </div>
            </Modal>
            <div className="guess-buttons-container">                
                <button className="guess-button" onClick={() => setQuestionModalOpen(true)}
                    disabled={isSolved}
                >
                    <SearchIcon/>
                    {t('puzzle.detective.question')}
                </button>
                <button className="guess-button" onClick={() => setShowAbandonModal(true)}
                    disabled={isSolved}
                >
                    <AbandonIcon />
                    {t(`puzzle.abandon.button`)}
                </button>
            </div>
            <section className="puzzle-guess-logs" ref={logsRef}>
                {guesses.length > 0 ?
                    <>                    
                        {guesses.map((guess: PuzzleGuess, index: number) => (
                            <div key={index} className={`puzzle-guess detective-guess type-${guess.type} ${guess.type == 0 && guess.answer ? 'correct' : ''}`}>
                                <div className="guess-group">
                                {guess.type == 0 ?
                                        <>
                                            {guess.pokemons?.map((pokemon: number) => (
                                                spritesMap.current ? <PokeSprite key={pokemon} slug={spritesMap.current[pokemon]}/> : null
                                            ) )}
                                            <p className="detective-status">
                                                {t(`puzzle.detective.${guess.answer ? "correct" : "incorrect"}`)}
                                            </p>
                                        </>
                                        :
                                        <p className="tip">
                                            <b>{getNaturalGroupnames([queryToObject(guess.query)], dictionary, t, locale, true)}? </b>
                                            {t(`puzzle.detective.question-${guess.answer ? "yes" : "no"}`)}
                                        </p>
                                }
                                </div>
                            </div>
                        ))}
                    </>
                    :
                    <div className="tab-help">
                        <img src={helpLogsImage.src}/>
                        <p>{t('puzzle.help.logs-detective')}</p>
                    </div>
                }
            </section>
        </>
    )
})

interface PuzzleGridProps {
    pokemons: Pokemon[];
    setCurrentDexView: React.Dispatch<React.SetStateAction<number | undefined>>;
    scrollToTab: (target: number, behavior?: "instant" | "smooth") => void;
    correctIds: number[];
    incorrectIds: number[];
    makeGuess: (id: number) => void;
    isSolved: boolean;
    abandoned: boolean;
}

const PuzzleGrid = ({pokemons, setCurrentDexView, scrollToTab, makeGuess, correctIds, incorrectIds, isSolved, abandoned}: PuzzleGridProps) => {
    const [pause, setPause] = useState<boolean>(false);
    const [selectedId, setSelectedId] = useState<number>(0);

    const handleSelect = useCallback((id: number) => {
        if (pause) return;

        makeGuess(id);

        selectedId == id ? setSelectedId(0) : setSelectedId(id);
    }, [selectedId, pause]);

    const handlePress = useCallback((id: number) => {
        scrollToTab(2);
        setCurrentDexView(id);
    }, [pause]);

    return (
        <motion.section
            className={`puzzle disable-select cols-5 ${pause || isSolved ? 'pause' : ''}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence>
                {pokemons.map((p: any, index: number) => {
                    const isSelected = false;
                    const isCorrect = correctIds.includes(p.id);
                    const isIncorrect = incorrectIds.includes(p.id);

                    return (
                        <PuzzleBlock
                            key={p.id}
                            pokemon={p}
                            mode="detective"
                            shinies={[]}
                            multiselect={false}
                            isSelected={isSelected}
                            isSolved={isSolved}
                            isCorrect={isCorrect}
                            isIncorrect={isIncorrect}
                            isAvailable={p.available}
                            isAbandoned={abandoned}
                            onSelect={handleSelect}
                            onPress={handlePress}
                        />
                    )
                })}
            </AnimatePresence>
        </motion.section>
    )
}

interface QuestionModalProps {
    questionModalOpen: boolean,
    setQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    dictionary: Record<string, string[]>;
    usedProperties: string[];
    askQuestion: (query: Record<string, string>) => void
}

const QuestionModal = React.memo(({questionModalOpen, setQuestionModalOpen, dictionary, usedProperties, askQuestion}: QuestionModalProps) => {
    const t = useTranslations("puzzle");
    const submitButton = useRef<HTMLButtonElement | null>(null);
    const [query, setQuery] = useState<QueryFilterValue | null>(null);

    useEffect(() => {
        if (questionModalOpen) setQuery(null);
    }, [questionModalOpen]);

    const filterPokemonsByQuery = useCallback(() => {
        if (query) askQuestion({ [query.key]: query.value });
    }, [askQuestion, query]);
    
    return (
        <Modal id="detective-question-modal" isOpen={questionModalOpen} setIsOpen={setQuestionModalOpen}>
            <QueryFilter dictionary={dictionary} isOpen={questionModalOpen} onChange={setQuery} submitButtonRef={submitButton} usedProperties={usedProperties} />
            <button ref={submitButton} className="modal-content-div" disabled={!query} onClick={filterPokemonsByQuery}>
                {t(`submit`)}
            </button>
        </Modal>
    )
})

interface PuzzleDetectiveProps {
    puzzle: PuzzleDetective,
    dictionary: any,
    refreshPuzzle: () => void,
    isSolved: boolean,
    setIsSolved: React.Dispatch<React.SetStateAction<boolean>>,
}

export default React.memo(function Puzzle({puzzle, dictionary, refreshPuzzle, isSolved, setIsSolved}: PuzzleDetectiveProps) {
    const t = useTranslations('puzzle');
    
    const [refresh, setRefresh] = useState<boolean>(false);

    const mainTabRef = useRef<HTMLDivElement>(null);
    const logsRef = useRef<HTMLElement | null>(null);
    const spritesMap = useRef<Record<number, string>>({});

    const [pokemonData, setPokemonData] = useState<any[]>([]);
    const [usedProperties, setUsedProperties] = useState<string[]>([]);
    const [visibleTab, setVisibleTab] = useState<number>(1);
    const [currentDexView, setCurrentDexView] = useState<number>();
    const [questionModalOpen, setQuestionModalOpen] = useState<boolean>(false);
    const [victoryOpen, setVictoryOpen] = useState<boolean>(false);
    const [correctIds, setCorrectIds] = useState<number[]>([]);
    const [incorrectIds, setIncorrectIds] = useState<number[]>([]);
    const [abandoned, setAbandoned] = useState<boolean>(false);
    const [guesses, setGuesses] = useState<PuzzleGuess[]>([]);
    const [guessLimit, setGuessLimit] = useState<0 | 1 | 5>(0);

    const scrollToTab = useCallback((target: number, behavior: ('smooth' | 'instant') = 'smooth') => {
        if (target !== visibleTab || behavior == 'instant') {
            const tab = document.querySelector(`.puzzle-tab[data-tab="${target}"]`) as HTMLElement;
            if (tab) tab.scrollIntoView({ behavior: behavior, block: 'center' });
        }
    }, [visibleTab])

    const tabsHeight = useMemo(() => {
       return mainTabRef.current?.offsetHeight;
    }, [puzzle, visibleTab, refresh]);

    const askQuestion = useCallback(async (query: Record<string, string>) => {
        try {
            const response = await fetch("/api/detective/question", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    secretId: puzzle.secretId,
                    pokemons: pokemonData,
                    query,
                }),
            });

            if (!response.ok) {
                throw new Error("Erro ao enviar pergunta");
            }

            const data = await response.json();
            const usedProperty = Object.keys(query)[0];
            setUsedProperties((previous) => previous.includes(usedProperty)
                ? previous
                : [...previous, usedProperty]);
            if (data.secretFound) {
                setIncorrectIds([]);
                setCorrectIds(data.affected);
            } else {
                setCorrectIds([]);
                setIncorrectIds(data.affected);
            }

            setGuesses((prev: PuzzleGuess[]) => [...prev, generateQuestionGuess(query, data.secretFound)]);
            if (logsRef.current) scrollGuessLogs(logsRef.current);

            scrollToTab(1, 'instant');
            setPokemonData(data.pokemons);
            setQuestionModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    }, [puzzle, pokemonData, setGuesses])

    const generateQuestionGuess = (query:  Record<string, string>, answer: boolean) => {
        return {
            type: 1,
            query: `${Object.keys(query)[0]}=${Object.values(query)[0]}`,
            answer: answer
        } as PuzzleGuess;
    }

    const makeGuess = useCallback((id: number, abandon=false) => {
        scrollToTab(1, 'instant');
        const isCorrect = id == puzzle.secretId;
        let guess: PuzzleGuess = {
            type: 0,
            pokemons: [id],
            query: "",
            answer: false
        };

        if (isCorrect) {
            setIncorrectIds([]);
            setCorrectIds([id]);
            setIsSolved(true);

            if (!abandon) {
                recordDetectiveCount();
                guess.answer = true;
            }

            setTimeout(() => {
                setVictoryOpen(true);
            }, 800);
        } else {
            setCorrectIds([]);
            setIncorrectIds([id]);
        }

        if (!abandon) setGuesses((prev: PuzzleGuess[]) => [...prev, guess]);
        if (logsRef.current) scrollGuessLogs(logsRef.current);
        setPokemonData(currentData => {
            if (!currentData) return currentData;

            return currentData.map((pokemon: any) => ({
                    ...pokemon,
                    available: isCorrect
                        ? pokemon.id == id
                        : pokemon.id == id
                            ? false
                            : pokemon.available,
                }));
        });
    }, [puzzle.secretId, setPokemonData])

    const abandonPuzzle = useCallback(() => {
        scrollToTab(1);
        setAbandoned(true);
        setIsSolved(true);
        makeGuess(puzzle.secretId, true);
    }, [puzzle])

    const updateSpritesMap = (pokemons: any[]) => {
        const processedSprites: Record<number, string> = {};
        
        pokemons.forEach((p: any) => {
            processedSprites[p.id] = p.sprite_default;
        });

        spritesMap.current = processedSprites;
    }

    useEffect(() => {
        if (guessLimit == 0) return;

        const realGuesses = guesses.filter((g: PuzzleGuess) => g.type == 0 && g.answer == false);
        if (realGuesses.length == guessLimit) {
            abandonPuzzle();
        }
    }, [guessLimit, guesses]);

    useEffect(() => {
        setPokemonData(puzzle.pokemons);
        setUsedProperties(puzzle.usedProperties ?? []);
        updateSpritesMap(puzzle.pokemons);
        setGuessLimit(puzzle.guess_limit);
        const timer = setTimeout(() => {
            scrollToTab(1, 'instant');
        }, 0);

        return () => clearTimeout(timer);
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

    return (
        <>
            <QuestionModal
                questionModalOpen={questionModalOpen}
                setQuestionModalOpen={setQuestionModalOpen}
                dictionary={dictionary}
                usedProperties={usedProperties}
                askQuestion={askQuestion}
            />
            <VictoryModal
                guesses={guesses}
                victoryOpen={victoryOpen}
                setVictoryOpen={setVictoryOpen}
                abandoned={abandoned}
                refreshPuzzle={refreshPuzzle}
            />
            <ul className="puzzle-tabs-container" style={{'--height': `${tabsHeight}px`, '--cols': 5, '--rows': 5} as React.CSSProperties}>
                <PuzzleTab setVisibleTab={setVisibleTab} tab={0}>
                    <div className="window-container cut-left">
                        <section className="window-info-row">
                            <LogsIcon/>
                            <p>{t('logs')}<span>0</span></p>
                        </section>
                        <GuessLogs
                            guesses={guesses}
                            dictionary={dictionary}
                            setQuestionModalOpen={setQuestionModalOpen}
                            abandonPuzzle={abandonPuzzle}
                            isSolved={isSolved}
                            logsRef={logsRef}
                            spritesMap={spritesMap}
                        />
                    </div>
                </PuzzleTab>
                <PuzzleTab setVisibleTab={setVisibleTab} tab={1}>
                    <div className="detective-sprite">
                        <img src={ch_sprite.src} />
                    </div>
                    <div className="window-container puzzle-window cut-left" ref={mainTabRef}>
                        <section className="window-info-row">                            
                            <GridIcon/>
                            <p>{t('puzzle')}{<span>{t(`detective.label`)}</span>}</p>
                        </section>
                        <PuzzleGrid
                            pokemons={pokemonData}
                            setCurrentDexView={setCurrentDexView}
                            scrollToTab={scrollToTab}
                            makeGuess={makeGuess}
                            correctIds={correctIds}
                            incorrectIds={incorrectIds}
                            isSolved={isSolved}
                            abandoned={abandoned}
                        />
                    </div>
                </PuzzleTab>
                <PuzzleTab setVisibleTab={setVisibleTab} tab={2}>
                    <div className="window-container cut-right">
                        <section className="window-info-row">
                            <DexIcon/>
                            <p>{t('dex')}</p>
                        </section>
                        <DexView pokemonId={currentDexView} />
                    </div>
                </PuzzleTab>
            </ul>
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
            </nav>
            {!isSolved &&
                <section id="detective-question-button" className="puzzle-extra-button">
                    <button onClick={() => setQuestionModalOpen(true)}>
                        <SearchIcon/>
                        <p>{t('detective.question')}</p>
                    </button>
                </section>
            }
        </>
    )
})