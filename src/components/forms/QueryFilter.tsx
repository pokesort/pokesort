'use client'

import React from 'react';
import { useForm, FieldValues, UseFormReturn, useWatch } from "react-hook-form";

import '@/src/styles/components/SelectPokemon.scss';
import { useTranslations } from 'next-intl';
import Input from './Input';

interface QueryFilterProps {
    name?: string;
    form?: UseFormReturn<FieldValues, any, FieldValues>
    limit?: 1 | 2 | 3
}

export default React.memo(function QueryFilter({name="query", form, limit=3}: QueryFilterProps) {
    const t = useTranslations();

    if (!form) {
        form = useForm();
    }

    const watched = form.watch(name);
    
    return (
        <>
            <Input form={form} name={name} type="text" />
        </>
    )
})