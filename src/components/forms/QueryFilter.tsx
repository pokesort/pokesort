'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { FIELD_OPTIONS, toTitleCase } from '@/src/scripts/utils';
import '@/src/styles/components/QueryFilter.scss';

export interface QueryFilterValue {
    key: string;
    value: string;
}

interface QueryFilterProps {
    name?: string;
    form?: UseFormReturn<FieldValues, any, FieldValues>;
    dictionary?: Record<string, string[]>;
    onChange?: (filter: QueryFilterValue | null) => void;
    suggestionLimit?: number;
    isOpen?: boolean;
    submitButtonRef?: React.RefObject<HTMLButtonElement | null>;
    usedProperties?: string[];
}

interface Suggestion {
    value: string;
    label: string;
}

const normalize = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

export default React.memo(function QueryFilter({
    name = 'query',
    form,
    dictionary = {},
    onChange,
    suggestionLimit = 20,
    isOpen = false,
    submitButtonRef,
    usedProperties = [],
}: QueryFilterProps) {
    const t = useTranslations();
    const localForm = useForm();
    const activeForm = form ?? localForm;
    const [propertyQuery, setPropertyQuery] = useState('');
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [valueQuery, setValueQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setPropertyQuery('');
        setSelectedKey(null);
        setValueQuery('');
        activeForm.setValue(name, '');
        onChange?.(null);
        inputRef.current?.focus({ preventScroll: true });
    }, [activeForm, isOpen, name, onChange]);

    const propertyOptions = useMemo(() => Object.keys(FIELD_OPTIONS).map((key) => ({
        key,
        value: key,
        label: t(`groupnames.${key}.short`),
    })), [t]);
    const availablePropertyOptions = useMemo(
        () => propertyOptions.filter(({ key }) => !usedProperties.includes(key)),
        [propertyOptions, usedProperties],
    );

    const valueOptions = useMemo(
        () => selectedKey ? valueOptionsFor(selectedKey, dictionary, t) : [],
        [dictionary, selectedKey, t],
    );
    const selectedValue = valueQuery
        ? valueOptions.find(({ value, label }) =>
            normalize(label) === normalize(valueQuery) || normalize(value) === normalize(valueQuery),
        )
        : undefined;

    const visibleSuggestions = useMemo(() => {
        const query = normalize(selectedKey ? valueQuery : propertyQuery);

        if (selectedKey) {
            return valueOptions
                .filter(({ value, label }) => !query || normalize(label).includes(query) || normalize(value).includes(query))
                .slice(0, suggestionLimit);
        }

        return availablePropertyOptions
            .filter(({ key, label }) => !query || normalize(label).includes(query) || normalize(key).includes(query))
            .slice(0, suggestionLimit);
    }, [availablePropertyOptions, propertyQuery, selectedKey, suggestionLimit, valueOptions, valueQuery]);

    const updateForm = (key: string | null, value: string) => {
        activeForm.setValue(name, key ? `${key}=${value}` : value);
    };

    const selectProperty = (key: string) => {
        setSelectedKey(key);
        setPropertyQuery('');
        setValueQuery('');
        updateForm(key, '');
        onChange?.(null);
    };

    const selectValue = (suggestion: Suggestion) => {
        setValueQuery(suggestion.label);
        updateForm(selectedKey, suggestion.value);
        if (selectedKey) onChange?.({ key: selectedKey, value: suggestion.value });
    };

    const clearSelectedValue = () => {
        setValueQuery('');
        updateForm(selectedKey, '');
        onChange?.(null);
        inputRef.current?.focus({ preventScroll: true });
    };

    const clearSelectedProperty = () => {
        setSelectedKey(null);
        setPropertyQuery('');
        setValueQuery('');
        updateForm(null, '');
        onChange?.(null);
        inputRef.current?.focus({ preventScroll: true });
    };

    const handlePropertyChange = (value: string) => {
        const colonIndex = value.indexOf(':');
        if (colonIndex >= 0) {
            const propertyName = normalize(value.slice(0, colonIndex).trim());
            const property = availablePropertyOptions.find(({ key, label }) =>
                normalize(label) === propertyName || normalize(key) === propertyName,
            );

            if (property) {
                const nextValue = value.slice(colonIndex + 1).trimStart();
                setSelectedKey(property.key);
                setPropertyQuery('');
                setValueQuery(nextValue);
                updateForm(property.key, nextValue);
                const matchedValue = valueOptionsFor(property.key, dictionary, t)
                    .find(({ value: optionValue, label }) =>
                        normalize(label) === normalize(nextValue) || normalize(optionValue) === normalize(nextValue),
                    );
                onChange?.(matchedValue ? { key: property.key, value: matchedValue.value } : null);
                return;
            }
        }

        setPropertyQuery(value);
        setSelectedKey(null);
        setValueQuery('');
        updateForm(null, value);
        onChange?.(null);
    };

    const handleValueChange = (value: string) => {
        setValueQuery(value);
        updateForm(selectedKey, value);
        const match = valueOptions.find(({ value: optionValue, label }) =>
            normalize(label) === normalize(value) || normalize(optionValue) === normalize(value),
        );
        onChange?.(selectedKey && match ? { key: selectedKey, value: match.value } : null);
    };

    return (
        <div className="query-filter">
            <div className="query-filter-input">
                {selectedKey && (
                    <span className="query-filter-token query-filter-property">
                        <span>{t(`groupnames.${selectedKey}.short`)}:</span>
                    </span>
                )}
                {selectedValue && (
                    <span className="query-filter-token query-filter-value">
                        <span>{selectedValue.label}</span>
                    </span>
                )}
                <input
                    aria-label={selectedKey ? t(`groupnames.${selectedKey}.short`) : t('groupnames.custom.short')}
                    autoComplete="off"
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            inputRef.current?.blur();
                            submitButtonRef?.current?.click();
                        }
                        if (event.key !== 'Backspace' || !selectedKey) return;
                        if (selectedValue) {
                            event.preventDefault();
                            clearSelectedValue();
                        } else if (!valueQuery) {
                            event.preventDefault();
                            clearSelectedProperty();
                        }
                    }}
                    onChange={(event) => selectedKey
                        ? handleValueChange(event.target.value)
                        : handlePropertyChange(event.target.value)}
                    ref={inputRef}
                    type="text"
                    value={selectedKey ? (selectedValue ? '' : valueQuery) : propertyQuery}
                />
            </div>
            <ul className="query-filter-suggestions">
                {visibleSuggestions.map((suggestion) => (
                    <li key={suggestion.value}>
                        <button className="flat"
                            onClick={() => selectedKey
                                ? selectValue(suggestion)
                                : selectProperty(suggestion.value)}
                            type="button"
                        >
                            {suggestion.label}
                        </button>
                    </li>
                ))}
                {!selectedKey &&
                    propertyOptions.filter((e) => !availablePropertyOptions.includes(e)).map((e) => (
                        <button key={e.key} className="flat" disabled={true}>
                            {e.label}
                        </button>
                    ))
                }
            </ul>
        </div>
    );
});

function valueOptionsFor(
    key: string,
    dictionary: Record<string, string[]>,
    t: ReturnType<typeof useTranslations>,
): Suggestion[] {
    const definition = FIELD_OPTIONS[key as keyof typeof FIELD_OPTIONS];
    let values: string[];

    if (Array.isArray(definition)) {
        values = definition;
    } else if (definition && typeof definition === 'object' && 'min' in definition && 'max' in definition) {
        values = Array.from(
            { length: definition.max - definition.min + 1 },
            (_, index) => `${definition.min + index}`,
        );
    } else {
        return [];
    }

    return values.map((value) => {
        if (['weak', 'strong'].includes(key)) {
            return { value, label: t(`groupnames.types.${value}`) };
        }
        if (['moves', 'abilities'].includes(key)) {
            const dictionaryValue = dictionary[key]?.[Number(value)];
            return { value, label: dictionaryValue ? toTitleCase(dictionaryValue) : value };
        }
        return { value, label: t(`groupnames.${key}.${value}`) };
    });
}