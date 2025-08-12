'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, SubmitHandler } from "react-hook-form";

import '@/src/styles/components/FormInput.scss';

interface InputProps {
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'toggle';
    label: string;
    name: string;
    // form?: UseFormReturn<FieldValues, any, FieldValues>
    options?: Record<string, string>;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
}

export default React.memo(function Input({type, label, name, options={}, readonly=false, disabled=false, required=false}: InputProps) {
    
    const form = useForm();
    const watchedFields = form.watch();

    const watched = form.watch(name);

    useEffect(() => {
        console.log(watched);
    }, [watched])

    switch (type) {
        case 'text':
        case 'number':
        case 'date':
            return (
                <label className="form-label">
                    <span>{label}</span>
                    <input className="inner-input" type={type} defaultValue="" autoComplete="off"
                        {...form.register(name, { required })} readOnly={readonly} disabled={disabled} />
                </label>
            )
        case 'select':
        case 'multiselect':
            return (
                <div className="form-label">
                    <span>{label}</span>
                    <input className="inner-input" type="text" defaultValue="" autoComplete="off" readOnly={true} />
                    <ul className="select-options">
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
        case 'toggle':
            return (
                <p>Toggle</p>
            )
    }

})