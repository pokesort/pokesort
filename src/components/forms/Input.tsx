'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm, SubmitHandler, FieldValues, UseFormReturn } from "react-hook-form";

import '@/src/styles/components/FormInput.scss';
import SelectHandle from '../svg/SelectHandle';

interface InputProps {
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'cloud';
    label: string;
    name: string;
    form?: UseFormReturn<FieldValues, any, FieldValues>
    options?: Record<string, string>;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
    defaultValue?: string | string[];
}

export default React.memo(function Input({type, label, name, form=undefined, options={}, readonly=false, disabled=false, required=false, defaultValue=""}: InputProps) {
    
    if (form == undefined) {
        form = useForm();
    }
    const watched = form.watch(name);

    // useEffect(() => {
    //     console.log(watched);
    // }, [watched])

    switch (type) {
        case 'text':
        case 'number':
        case 'date':
            return (
                <label className="form-label">
                    <span>{label}</span>
                    <input className="inner-input" type={type} defaultValue={defaultValue} autoComplete="off"
                        {...form.register(name, { required })} readOnly={readonly} disabled={disabled} />
                </label>
            )
        case 'select':
        case 'multiselect':
            const [open, setOpen] = useState(false);
            const selectWrapper = useRef<HTMLDivElement>(null);

            useEffect(() => {
                function handleClickOutside(e: MouseEvent) {
                    if (selectWrapper.current && !selectWrapper.current.contains(e.target as Node)) {
                        setOpen(false);
                    }
                }
                document.addEventListener("mousedown", handleClickOutside);
                return () => document.removeEventListener("mousedown", handleClickOutside);
            }, []);

            const selectValue = useMemo(() => {
            if (typeof watched === "string") {
                return options[watched] || "";
            } else if (Array.isArray(watched)) {
                return watched
                .map((e: string) => options[e] || "")
                .join(", ");
            }
            return "";
            }, [watched]);

            useEffect(() => {
                Object.keys(options).forEach((value: string) => {
                    if (defaultValue.includes(value)) {
                        form.setValue(name, [value]);
                    }
                })
            }, [defaultValue])

            return (
                <div className="form-label" ref={selectWrapper} onFocus={() => setOpen(true)}>
                    <span>{label}</span>
                    <input className="inner-input" type="text" defaultValue={selectValue} autoComplete="off"/>
                    <SelectHandle />
                    <ul className={`select-options ${open ? 'open' : ''}`}>
                        {Object.keys(options).map((value: string) => (
                            <label key={value}>
                                <input type={type == 'select' ? 'radio' : 'checkbox'}
                                {...form.register(name)} value={value} readOnly={readonly} disabled={disabled} />
                                <span>{options[value]}</span>
                            </label>
                        ))}
                    </ul>
                </div>
            )
        case 'cloud':
            return (
                <div className="form-label">
                    <span>{label}</span>
                    <ul className="checkbox-cloud">
                        {Object.keys(options).map((value: string) => (
                            <label className="inner-input" key={value}>
                                <input type="checkbox"
                                {...form.register(name)} value={value} readOnly={readonly} disabled={disabled} />
                                <span>{options[value]}</span>
                            </label>
                        ))}
                    </ul>
                </div>
            )
    }

})