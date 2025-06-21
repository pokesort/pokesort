import React, { useState, useEffect } from 'react';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

interface CountdownProps {
  targetDate: Date;
}

const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const difference = +targetDate - +new Date();
  let timeLeft: TimeLeft = {
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  };

  if (difference > 0) {
    timeLeft = {
      hours: Math.floor((difference / (1000 * 60 * 60))),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
    };
  } else {
    timeLeft.isExpired = true;
  }

  return timeLeft;
};

export default function Countdown ({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    if (isNaN(targetDate.getTime())) {
        console.error("Data inválida no componente de countdown");
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
    }

    if (timeLeft.isExpired) {
      return;
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, timeLeft.isExpired]); // Re-run effect if targetDate changes or expiration state changes

  if (timeLeft.isExpired) {
    return <>00:00:00</>;
  }

  return (
    <>
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
    </>
  );
};