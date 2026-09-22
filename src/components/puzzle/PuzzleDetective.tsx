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
import TipIcon from '../svg/TipIcon';
import PuzzleBlock from "./PuzzleBlock";

import ch_sprite from "@/src/assets/images/challenge_d.png";
import DexView from "../DexView";
import AbandonIcon from "../svg/AbandonIcon";
import Modal from "../Modal";
import QueryFilter from "../forms/QueryFilter";
import { useForm } from "react-hook-form";
import { form } from "framer-motion/client";

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

interface GuessLogsProps {
    setQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GuessLogs = React.memo(({setQuestionModalOpen}: GuessLogsProps) => {
    const t = useTranslations('');
    // const locale = useLocale();
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
                    <button className="modal-content-div" onClick={() => {setShowAbandonModal(false)}}>
                        <p>{t(`puzzle.abandon.yes`)}</p>
                    </button>
                </div>
            </Modal>
            <div className="guess-buttons-container">                
                <button className="guess-button" onClick={() => setQuestionModalOpen(true)}>
                    <TipIcon />
                    {t('puzzle.detective.question')}
                </button>
                <button className="guess-button" onClick={() => setShowAbandonModal(true)}
                    // disabled={isSolved}
                >
                    <AbandonIcon />
                    {t(`puzzle.abandon.button`)}
                </button>
            </div>
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
}

const PuzzleGrid = ({pokemons, setCurrentDexView, scrollToTab, makeGuess, correctIds, incorrectIds}: PuzzleGridProps) => {
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
            className={`puzzle disable-select cols-5 ${pause ? 'pause' : ''}`}
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

interface QuestionModalProps {
    questionModalOpen: boolean,
    setQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    askQuestion: (query: Record<string, string>) => void
}

const QuestionModal = React.memo(({questionModalOpen, setQuestionModalOpen, askQuestion}: QuestionModalProps) => {
    const form = useForm();
    const query = form.watch("query");

    const filterPokemonsByQuery = useCallback(() => {
        let queryObject: Record<string, string> = {};
        const querySplit = query.split("=");
        queryObject[querySplit[0]] = querySplit[1];

        askQuestion(queryObject);
    }, [query])
    
    return (
        <Modal id="detective-question-modal" isOpen={questionModalOpen} setIsOpen={setQuestionModalOpen}>
            <QueryFilter form={form} limit={1} />
            <button className="modal-content-div" onClick={filterPokemonsByQuery}>
                Submit
            </button>
        </Modal>
    )
})

interface PuzzleDetectiveProps {
    puzzle: PuzzleDetective,
    setPuzzle: React.Dispatch<React.SetStateAction<PuzzleDetective | undefined>>
}

export default React.memo(function Puzzle({puzzle, setPuzzle}: PuzzleDetectiveProps) {
    const t = useTranslations('puzzle');
    
    const [refresh, setRefresh] = useState<boolean>(false);

    const mainTabRef = useRef<HTMLDivElement>(null);
    const [visibleTab, setVisibleTab] = useState<number>(1);
    const [currentDexView, setCurrentDexView] = useState<number>();
    const [questionModalOpen, setQuestionModalOpen] = useState<boolean>(false);
    const [correctIds, setCorrectIds] = useState<number[]>([]);
    const [incorrectIds, setIncorrectIds] = useState<number[]>([]);

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
                    pokemons: puzzle.pokemons,
                    query,
                }),
            });

            if (!response.ok) {
                throw new Error("Erro ao enviar pergunta");
            }

            const data = await response.json();
            if (data.secretFound) {
                setIncorrectIds([]);
                setCorrectIds(data.affected);
            } else {
                setCorrectIds([]);
                setIncorrectIds(data.affected);
            }

            setPuzzle(data);
            setQuestionModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    }, [puzzle])

    const makeGuess = useCallback((id: number) => {
        if (id == puzzle.secretId) {
            setCorrectIds([id]);
            return;
        }

        const updatedPokemons = puzzle.pokemons.map((p: any) => {
            if (p.id == id) p.available = false;
            return p;
        })
        setIncorrectIds([id]);
        setPuzzle({...puzzle, pokemons: updatedPokemons})
    }, [puzzle])

    useEffect(() => {
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
                askQuestion={askQuestion}
            />
            <ul className="puzzle-tabs-container" style={{'--height': `${tabsHeight}px`, '--cols': 5, '--rows': 5} as React.CSSProperties}>
                <PuzzleTab setVisibleTab={setVisibleTab} tab={0}>
                    <div className="window-container cut-left">
                        <section className="window-info-row">
                            <LogsIcon/>
                            <p>{t('logs')}<span>0</span></p>
                        </section>
                        <GuessLogs
                            setQuestionModalOpen={setQuestionModalOpen}
                        />
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
                            makeGuess={makeGuess}
                            correctIds={correctIds}
                            incorrectIds={incorrectIds}
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
                    {t('logs')}<span>0</span>
                </button>
                <button onClick={() => scrollToTab(1)} className={visibleTab == 1 ? 'active' : ''}>
                    {t('puzzle')}
                </button>
                <button onClick={() => scrollToTab(2)} className={visibleTab == 2 ? 'active' : ''}>
                    {t('dex')}
                </button>
            </nav>
            <section id="detective-question-button" className="puzzle-extra-button">
                <button onClick={() => setQuestionModalOpen(true)}>
                    <TipIcon/>
                    <p>{t('detective.question')}</p>
                </button>
            </section>
        </>
    )
})