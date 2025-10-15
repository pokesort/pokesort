'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm, SubmitHandler, FieldValues, UseFormReturn } from "react-hook-form";
import { StaticImageData } from 'next/image';

import '@/src/styles/components/FormInput.scss';
import '@/src/styles/components/ChallengeSelect.scss';
import SelectHandle from '../svg/SelectHandle';
import Modal from '../Modal';
import { useTranslations } from 'next-intl';

import ch1_sprite from "@/src/assets/images/challenge_1.png";
import ch2_sprite from "@/src/assets/images/challenge_2.png";
import ch3_sprite from "@/src/assets/images/challenge_3.png";
import ch4_sprite from "@/src/assets/images/challenge_4.png";
import ChallengeIcon from '../svg/ChallengeIcon';
const challengeSprites: Record<string, StaticImageData> = {
  '1': ch1_sprite,
  '2': ch2_sprite,
  '3': ch3_sprite,
  '4': ch4_sprite
};
const challengeKey = 'u_challenge';

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
}

export default React.memo(function Input({name="challenge", label="Challenge", minimal=true, infinite=false, form=undefined, options={}, defaultValue="", style={}, onInput=undefined}: InputProps) {
    const t = useTranslations();
    const challenge_options: Record<string, string> = {};
    ['1', '2', '3', '4'].forEach((challenge: string) => {
        challenge_options[`${challenge}`] = t(`puzzle.challenge.${challenge}`);
    });

    if (form == undefined) {
        form = useForm();
    }
    const watched = form.watch(name);

    const [open, setOpen] = useState(false);
    const [inputText, setInputText] = useState('');

    const updatePreferredChallenge = (challenge: string) => {
        localStorage.setItem(challengeKey, challenge);
        setOpen(false);
    };

    useEffect(() => {
        form.setValue(name, defaultValue);
    }, [])

    useEffect(() => {
        updatePreferredChallenge(watched);
        setInputText(options[watched]);
    }, [watched]);

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
                {Object.keys(challenge_options).map((value: string) => (
                    <label className={`challenge-label ${Object.keys(options).includes(value) ? "" : "disabled"}`} key={value}
                        onClick={() => setOpen(false)}>
                        <input type="radio" {...form.register(name)} value={value} />     
                        <img src={challengeSprites[value].src} />
                        <div>
                            <h3>
                                {challenge_options[value]}
                            </h3>
                            <p>
                                { t(`puzzle.challenge.help.${value}`) }
                            </p>
                        </div>
                    </label>
                ))}
            </Modal>
        </>
    )
})