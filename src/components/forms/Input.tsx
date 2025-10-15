'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useController, FieldValues, UseFormReturn } from "react-hook-form";

import '@/src/styles/components/FormInput.scss';
import SelectHandle from '../svg/SelectHandle';

interface InputProps {
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'cloud';
    label?: string;
    name: string;
    form?: UseFormReturn<FieldValues, any, FieldValues>
    options?: Record<string, string>;
    placeholder?: string;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
    max?: number;
    defaultValue?: string | string[];
    style?: React.CSSProperties;
    onInput?: () => void;
}

export default React.memo(function Input({
    type,
    label,
    name,
    form,
    options = {},
    placeholder = "",
    readonly = false,
    disabled = false,
    required = false,
    max = 0,
    defaultValue = "",
    onInput
}: InputProps) {

    if (!form) {
        throw new Error("O componente input precisa receber um prop de formulário");
    }

    // Hook up this field to react-hook-form
    const { field } = useController({
        name,
        control: form.control,
        defaultValue
    });

    switch (type) {
        case 'text':
        case 'number':
        case 'date':
            return (
                <label className="form-label" style={style}>
                    {label && <span>{label}</span>}
                    <input
                        className="inner-input"
                        type={type}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        autoComplete="off"
                        onInput={onInput}
                        placeholder={placeholder}
                        readOnly={readonly}
                        disabled={disabled}
                        required={required}
                    />
                </label>
            );

        case 'select':
        case 'multiselect':
            const [open, setOpen] = useState(false);
            const selectWrapper = useRef<HTMLDivElement>(null);
            const history = useRef<string[]>([]);

            // close on outside click
            useEffect(() => {
                function handleClickOutside(e: MouseEvent) {
                    if (selectWrapper.current && !selectWrapper.current.contains(e.target as Node)) {
                        setOpen(false);
                    }
                }
                document.addEventListener("mousedown", handleClickOutside);
                return () => document.removeEventListener("mousedown", handleClickOutside);
            }, []);

            // enforce max selections
            useEffect(() => {
                if (max > 0 && Array.isArray(field.value) && field.value.length > max) {
                    const [, ...shifted] = history.current;
                    history.current = shifted;
                    field.onChange(shifted);
                }
            }, [field.value, max]);

            const selectValue = useMemo(() => {
                if (typeof field.value === "string") {
                    return options[field.value] || "";
                } else if (Array.isArray(field.value)) {
                    return field.value.map((e: string) => options[e] || "").join(", ");
                }
                return "";
            }, [field.value, options]);

            return (
                <div className="form-label" ref={selectWrapper} onFocus={() => setOpen(true)} style={style}>
                    {label && <span>{label}</span>}
                    <input
                        className="inner-input"
                        type="text"
                        value={selectValue}
                        readOnly
                        autoComplete="off"
                    />
                    <SelectHandle />
                    <ul className={`select-options ${open ? 'open' : ''}`}>
                        {Object.keys(options).map((value: string) => (
                            <label key={value}>
                                <input
                                    type={type === 'select' ? 'radio' : 'checkbox'}
                                    checked={
                                        !Array.isArray(field.value)
                                            ? field.value === value
                                            : field.value?.includes(value)
                                    }
                                    onChange={(e) => {
                                        if (type === 'select') {
                                            field.onChange(value);
                                        } else {
                                            const arr = Array.isArray(field.value) ? [...field.value] : [];
                                            if (e.target.checked) {
                                                arr.push(value);
                                            } else {
                                                const idx = arr.indexOf(value);
                                                if (idx > -1) arr.splice(idx, 1);
                                            }
                                            field.onChange(arr);
                                        }
                                    }}
                                    value={value}
                                    readOnly={readonly}
                                    disabled={disabled}
                                />
                                <span>{options[value]}</span>
                            </label>
                        ))}
                    </ul>
                </div>
            );

        case 'cloud':
            return (
                <div className="form-label" style={style}>
                    {label && <span>{label}</span>}
                    <ul className="checkbox-cloud">
                        {Object.keys(options).map((value: string) => (
                            <label className="inner-input" key={value}>
                                <input
                                    type="checkbox"
                                    checked={field.value?.includes?.(value) || false}
                                    onChange={(e) => {
                                        const arr = Array.isArray(field.value) ? [...field.value] : [];
                                        if (e.target.checked) {
                                            arr.push(value);
                                        } else {
                                            const idx = arr.indexOf(value);
                                            if (idx > -1) arr.splice(idx, 1);
                                        }
                                        field.onChange(arr);
                                    }}
                                    value={value}
                                    readOnly={readonly}
                                    disabled={disabled}
                                />
                                <span>{options[value]}</span>
                            </label>
                        ))}
                    </ul>
                </div>
            );
    }
});
