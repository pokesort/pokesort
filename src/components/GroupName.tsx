"use client"

import { useTranslations } from 'next-intl';
import { toTitleCase } from '@/src/scripts/utils';

interface GroupNameProps {
    query: string;
}

interface Group {
    key: string;
    value: string;
}

function getGroupList (queries: string) {
    let queryList = queries.slice(1).split('&');
    let groupList: Group[] = [];

    for (const query of queryList) {
        let newGroup = query.split('=');
        groupList.push({
            key: newGroup[0].replaceAll('_', '-'),
            value: newGroup[1]
        } as Group);
    }
    
    return groupList;
}

function getNaturalGroupnames (groups: Group[]) {
    const t = useTranslations();
    const direct = ['moves', 'abilities', 'region'];
    const types = ['types', 'weak', 'strong', 'immune'];

    let groupNames: string[] = [];

    for (const group of groups) {
        let output = '';
        output += t(`groupnames.${group.key}.long`)
        if (direct.includes(group.key)) {            
            output += toTitleCase(group.value.replaceAll('-', ' '));
        } else if(types.includes(group.key)) {
            output += t(`groupnames.types.${group.value}`)
        } else {
            output += t(`groupnames.${group.key}.${group.value}`)
        }
        groupNames.push(output);
    }

    return groupNames;
}

export default function GroupName ({query}: GroupNameProps) {
    const t = useTranslations();
    
    if (query[0] !== '?')
        return ( <span>{t(`groupname.custom.${query}`)}</span> )

    const groupList = getGroupList(query);
    const naturalGroupNames = getNaturalGroupnames(groupList);
    let result = naturalGroupNames.join(' | ');

    return ( <span>{result}</span> )
}