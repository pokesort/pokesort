'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import InputMask from 'react-input-mask';
import { useForm, SubmitHandler } from "react-hook-form";

import '@/src/styles/components/FormInput.scss';

interface InputProps {
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'toggle';
    label: string;
    name: string;
    // form?: UseFormReturn<FieldValues, any, FieldValues>
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
}

export default React.memo(function Input({type, label, name, readonly=false, disabled=false, required=false}: InputProps) {
    
    const form = useForm();
    const watchedFields = form.watch();

    const watched = form.watch(name);

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
                <p>Select</p>
            )
        case 'toggle':
            return (
                <p>Toggle</p>
            )
    }

})