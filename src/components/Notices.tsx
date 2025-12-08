"use client"

import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import '@/src/styles/components/Notices.scss';
import Loading from './Loading';
import Modal from './Modal';
import PageView from './PageView';
import { formatDate } from '../scripts/utils';

const latestNoticeKey = 'u_latestnotice';

interface NoticesProps {
    noticesOpen: boolean,
    setNoticesOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default React.memo(function Notices({noticesOpen, setNoticesOpen}: NoticesProps) {
    const t = useTranslations("notices");
    const locale = useLocale().includes('pt') ? 'pt' : 'en';
    const [notices, setNotices] = useState<any[]>();

    const updateLatestSeen = (notice: any) => {
        if (!notice) return;

        const this_id = notice._id;
        const latest_id = localStorage.getItem(latestNoticeKey);

        if (latest_id == null || latest_id != this_id) {
            localStorage.setItem(latestNoticeKey, this_id);
            setNoticesOpen(true);
        }
    };

    useEffect(() => {
        if (notices) return;

        const fetchNotices = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const [noticesResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notices/get`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!noticesResponse.ok) {
                    throw new Error('Erro ao obter avisos.');
                }
                const [noticesData] = await Promise.all([
                    noticesResponse.json(),
                ]);
                
                setNotices(noticesData.notices);
                updateLatestSeen(noticesData.notices[0] ?? null);
            } catch (e) {
                console.error(e);
            }
        }

        fetchNotices();
    }, [notices])

    return (
        <>            
            <Modal id="notice-modal" title={t(`label`)} isOpen={noticesOpen} setIsOpen={setNoticesOpen}>
                {!notices ?
                    <Loading expand={true} />
                    :
                    <PageView>
                        {notices.length < 1 &&
                            <p className="notices-empty">
                                {t(`empty`)}
                            </p>
                        }
                        {notices.map((notice: any, index: number) => {
                            const content = notice.translations.filter((t: any) => t.locale == locale)[0];

                            return (
                                <li key={index} className="notice-item">
                                    <h4>
                                        {content.title}
                                        <br/>
                                        <span>
                                            {formatDate(notice.created_at.split('T')[0], locale, true)}
                                        </span>
                                    </h4>
                                    {content.body.map((text: string, bodyIndex: number) => (
                                        <p key={bodyIndex}>
                                            {text}
                                        </p>
                                    ))}
                                </li>
                            )
                        })}
                    </PageView>
                }
            </Modal>
        </>
    )
});