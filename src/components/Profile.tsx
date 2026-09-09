"use client"

import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import '@/src/styles/components/Profile.scss';
import Modal from './Modal';
import PokeSprite from './PokeSprite';
import Input from './forms/Input';
import { FieldValues, useForm } from 'react-hook-form';
import HeaderInfo from './svg/HeaderInfo';
import { ProfileData, TransferData } from '../assets/types/UserData';
import SelectPokemon from './forms/SelectPokemon';
import { exportData, importData, replaceTransferData } from '../lib/DataTransfer';

interface ProfileProps {
    profileOpen: boolean,
    setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>
    profile: ProfileData,
    setProfile: React.Dispatch<React.SetStateAction<ProfileData | undefined>>
}

export default function Profile({ profileOpen, setProfileOpen, profile, setProfile }: ProfileProps) {
    const t = useTranslations("profile");
    const form = useForm({
        defaultValues: profile as FieldValues
    });
    
    const partnerId = form.watch("partner");
    const importInput = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [showTransferConfirm, setShowTransferConfirm] = useState<boolean>(false);
    const [transferData, setTransferData] = useState<TransferData>({});

    const saveProfile = () => {
        setError(null);
        const body = form.getValues();
        setProfile({
            name: body.name,
            partner: body.partner
        } as ProfileData);
    }

    useEffect(() => {
        if (profileOpen == true) {
            form.reset(profile)
        } else {
            saveProfile();
        }
    }, [profileOpen]);

    const handleExport = async () => {
        saveProfile();
        exportData();
    }

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        try {
            setTransferData(await importData(file));
            setShowTransferConfirm(true);
        } catch {
            setError(t('transfer.invalid'));
        }
    };

    const handleImportConfirm = useCallback(() => {
        replaceTransferData(transferData)
        window.location.reload();
    }, [transferData])

    const confirmProfile = useMemo(() => {
        if (transferData.u_profile == undefined) return <></>;

        const profile: Record<string, string> = JSON.parse(transferData.u_profile);
        return (
            <div className="profile-import-preview">
                <div>
                    <PokeSprite slug={`${profile["partner"]}.png`} />
                </div>
                <p>{profile["name"]}</p>
            </div>
        )
    }, [transferData])

    return (
        <>
            <Modal id="profile-modal" background={true} title={t(`label`)} isOpen={profileOpen} setIsOpen={setProfileOpen} error={error}>
                <div className="profile-form">
                    <SelectPokemon form={form} name="partner" defaultValue={partnerId} label={t(`partner`)} />
                    <Input type="text" form={form} name="name" label={t(`name`)} />
                </div>
                <div className="profile-info">
                    <HeaderInfo />
                    <p>{t(`help`)}<br />{t(`help-2`)}</p>
                </div>

                <div className="modal-title modal-content-div">
                    <h1>{t(`transfer.label`)}</h1>
                </div>
                <p>
                    {t(`transfer.description`)}
                </p>
                <div className="transfer-buttons">
                    <button type="button" onClick={handleExport}>
                        {t(`transfer.export`)}
                    </button>
                    <button type="button" onClick={() => importInput.current?.click()}>
                        {t(`transfer.import`)}
                    </button>
                    <input
                        ref={importInput}
                        type="file"
                        accept=".pokesortdata"
                        onChange={handleImport}
                        hidden
                    />
                </div>
            </Modal>
            <Modal id="transfer-confirm" isOpen={showTransferConfirm} setIsOpen={setShowTransferConfirm} canClose={true} background={true}>
                <div className="modal-content-div">
                    <p>
                        {t(`transfer.confirmation`)}
                    </p>
                </div>
                {confirmProfile}
                <div className="button-row">
                    <button className="modal-content-div" onClick={() => setShowTransferConfirm(false)}>
                        <p>{t(`transfer.no`)}</p>
                    </button>
                    <button className="modal-content-div" onClick={() => {handleImportConfirm(); setShowTransferConfirm(false)}}>
                        <p>{t(`transfer.yes`)}</p>
                    </button>
                </div>
            </Modal>
        </>
    )
};