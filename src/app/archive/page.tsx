"use client"

import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns";
import Link from 'next/link';
import clsx from 'clsx';

import "@/src/styles/components/Archive.scss";
import { useLocale } from 'next-intl';
import Loading from '@/src/components/Loading';
import ArrowLeft from '@/src/components/svg/ArrowLeft';
import ArrowRight from '@/src/components/svg/ArrowRight';

interface CalendarProps {
    puzzles: Record<string, string> | undefined;
    loading: boolean;
}

function Calendar({puzzles, loading}: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const locale = useLocale();
    const today = new Date();
    let dates: string[] = [format(today, "yyyy-MM-dd")];
    if (puzzles) {
        dates = Object.keys(puzzles);
    }
    console.log(dates);

    const renderHeader = () => (
        <section className="window-info-row">
            <button className={isSameMonth(currentMonth, dates[0]) ? 'disabled' : ''} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ArrowLeft />
            </button>
            <p>
                {currentMonth.toLocaleDateString(locale, {
                    month: 'long',
                    year: 'numeric'
                })}
            </p>
            <button className={isSameMonth(currentMonth, today) ? 'disabled' : ''} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ArrowRight />
            </button>
        </section>
    );

    const renderCells = () => {
        if (!puzzles || loading) {
            return <Loading expand={true} />
        }

        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const rows = [];
        let days = [];
        let day = startDate;
        let foundToday = false;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const dayString = format(day, "yyyy-MM-dd");
                const userData: any = dates.includes(dayString) ? localStorage.getItem(`s_${puzzles[dayString]}`) : null

                const blockClasses = clsx(
                    'calendar-cell',
                    {
                        'hidden': !isCurrentMonth,
                        'disabled': !dates.includes(dayString) || foundToday,
                        'attempted': userData != null,
                        'complete': userData && userData.status == 1
                    }
                );
                if (!foundToday && isSameDay(day, today)) foundToday = true;

                days.push(
                    <Link href={`puzzle/${dayString}`} key={dayString} className={blockClasses}>
                        {format(day, "dd")}
                    </Link>
                );

                day = addDays(day, 1);
            }

            rows.push(
                <div className="calendar-cols" key={day.toString()}>
                    {days}
                </div>
            );

            days = [];
        }

        return <div className="calendar-rows">{rows}</div>;
    };

    return (
        <div className="window-container calendar">            
            {renderHeader()}
            {renderCells()}
        </div>
    )
}

export default function Archive() {
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [puzzles, setPuzzles] = useState<Record<string, string>>();

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const [puzzleResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/get?by=date`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!puzzleResponse.ok) {
                    throw new Error('Erro ao obter informações do puzzle.');
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);

                if (process.env.NODE_ENV === "development") {
                    console.log(puzzleData.puzzles);
                }
                setPuzzles(puzzleData.puzzles);
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {                 
                setLoading(false);
            }
        };

        fetchPageData();
    }, [])

    return (
        <Calendar puzzles={puzzles} loading={loading} />
    )
}