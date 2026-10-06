'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FieldValues, UseFormReturn } from "react-hook-form";
import { StaticImageData } from 'next/image';

import '@/src/styles/components/FormInput.scss';
import '@/src/styles/components/ChallengeSelect.scss';
import SelectHandle from '../svg/SelectHandle';
import Modal from '../Modal';
import { useTranslations } from 'next-intl';

import ch1_sprite from "@/src/assets/images/challenge_d.png";
import ch2_sprite from "@/src/assets/images/challenge_d.png";
import ch3_sprite from "@/src/assets/images/challenge_d.png";
import ch4_sprite from "@/src/assets/images/challenge_d.png";

import ChallengeIcon from '../svg/ChallengeIcon';
import { parseChallengeSelectFields, getPuzzleStatus } from '@/src/scripts/utils';
const challengeSprites: Record<string, StaticImageData> = {
  '1': ch1_sprite,
  '2': ch2_sprite,
  '3': ch3_sprite,
  '4': ch4_sprite,
};

type ChallengeFieldEntry = string | number[];
type ChallengeFields = Record<string, ChallengeFieldEntry[]>;

interface InputProps {
    name?: string;
    label?: string;
    minimal?: boolean;
    infinite?: boolean;
    form?: UseFormReturn<FieldValues, any, FieldValues>
    options?: Record<string, string>;
    defaultValue?: string;
    style?: React.CSSProperties;
    onInput?: () => void;
    challenges?: Record<number, string>;
}

export default React.memo(function Input({name="challenge", label="Challenge", minimal=true, infinite=false, form=undefined, options={}, defaultValue="", style={}, onInput=undefined, challenges=undefined}: InputProps) {
    const t = useTranslations();
    const challenge_options: Record<string, string> = {};
    ['1', '2', '3', '4'].forEach((challenge: string) => {
        challenge_options[`${challenge}`] = t(`puzzle.challenge.detective.${challenge}`);
    });

    if (form == undefined) {
        form = useForm();
    }
    const watched = form.watch(name);

    const [open, setOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [challengeFields, setChallengeFields] = useState<ChallengeFields>({
        1: [],
        2: ["shape", "egg_groups", "habitat", "color", "dual"],
        3: ["moves", "abilities", "step", "others", "dual"],
        4: ["types", "generation", "region", "form", "dual"],
    });

    useEffect(() => {
        form.setValue(name, defaultValue);
    }, [])

    useEffect(() => {
        setInputText(options[watched]);
    }, [watched]);

    const visibleChallengeValues = useMemo(() => {
        return Object.keys(challenge_options).filter((value: string) => {
            if (value !== '5') return true;
            if (infinite) return false;
        });
    }, [infinite, options, challenges, challenge_options]);

    return (
        <>
            {minimal ?
                <div className="form-label challenge-select" style={style} onClick={() => setOpen(true)}>
                    {label && <span>{label}</span>}
                    <input className="inner-input" type="text" defaultValue={inputText} readOnly={true} autoComplete="off"/>
                    <SelectHandle />
                    <ul className="select-options"></ul>
                </div>
            :
                <div className={`puzzle-challenge-select`}>
                    <label className={`${infinite && 'disabled'}`} onClick={() => setOpen(true)}>
                        <ChallengeIcon />
                        <p>{inputText}</p>
                        <img data-challenge={watched ?? defaultValue} src={challengeSprites[watched ?? defaultValue].src} />
                    </label>
                </div>
            }
            <Modal id="challenge-select-modal" title={label} background={true} isOpen={open} canClose={true} setIsOpen={setOpen}>
                <p>{t(`puzzle.challenge.detective.help`)}</p>
                {visibleChallengeValues.map((challenge: string) => (
                    <label className={`challenge-label detective-mode ${Object.keys(options).includes(challenge) ? "" : "disabled"}`} key={challenge}
                        onClick={() => setOpen(false)}>
                        <input type="radio" {...form.register(name)} value={challenge} />
                        {/* <img className={`challenge-img-${challenge}`} src={challengeSprites[challenge].src} /> */}
                        <div>
                            <h3>
                                {challenge_options[challenge]}
                            </h3>
                            {challengeFields[challenge] && challenge != "1" ? <ul>
                                {challengeFields[challenge].map((field, index) => {
                                        return (<li key={index}>
                                            {t(`groupnames.${field}.short`)}
                                        </li>)
                                })}
                            </ul>
                            :
                            <ul><li>
                                {t(`puzzle.challenge.detective.no-limit`)}
                            </li></ul>
                            }
                        </div>
                    </label>
                ))}
            </Modal>
        </>
    )
})