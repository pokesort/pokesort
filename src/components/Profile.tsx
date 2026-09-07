"use client"

import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import '@/src/styles/components/Profile.scss';
import Modal from './Modal';
import PokeSprite from './PokeSprite';
import Input from './forms/Input';
import { FieldValues, useForm } from 'react-hook-form';
import HeaderInfo from './svg/HeaderInfo';
import { ProfileData } from '../assets/types/UserData';
import SelectPokemon from './forms/SelectPokemon';

interface ProfileProps {
    profileOpen: boolean,
    setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>
    profile: ProfileData,
    setProfile: React.Dispatch<React.SetStateAction<ProfileData | undefined>>
}

export default function Profile({profileOpen, setProfileOpen, profile, setProfile}: ProfileProps) {
    const t = useTranslations("profile");
    const form = useForm({
        defaultValues: profile as FieldValues
    });
    const partnerId = form.watch("partner");

    useEffect(() => {
        if (profileOpen == true) {
            form.reset(profile)
        } else {
            const body = form.getValues();
            setProfile({
                name: body.name,
                partner: body.partner
            } as ProfileData);
        }
    }, [profileOpen]);

    return (
        <>
            
            <Modal id="profile-modal" background={true} title={t(`label`)} isOpen={profileOpen} setIsOpen={setProfileOpen}>
                <div className="profile-form">
                    <SelectPokemon form={form} name="partner" defaultValue={partnerId} label={t(`partner`)} />
                    <Input type="text" form={form} name="name" label={t(`name`)} />
                </div>
                <div className="profile-info">
                    <HeaderInfo />
                    <p>{t(`help`)}<br/>{t(`help-2`)}</p>
                </div>

                <div className="modal-title modal-content-div">
                    <h1>{t(`transfer.label`)}</h1>
                </div>
                <p>
                    {t(`transfer.description`)}
                </p>
                <div className="transfer-buttons">
                    <button>
                        {t(`transfer.export`)}
                    </button>
                    <button>
                        {t(`transfer.import`)}
                    </button>
                </div>
            </Modal>
        </>
    )
};