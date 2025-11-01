'use client';

import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';

interface DateSelectorProps {
  date?: Date;
  onClick: () => void;
}

export function DateSelector({ date, onClick }: DateSelectorProps) {
  const isToday = date
    ? format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    : true;

  const displayText = isToday
    ? 'Today'
    : format(date || new Date(), 'MMMM d, yyyy');

  return (
    <button
      onClick={onClick}
      className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-100 dark:bg-slate-800 pl-4 pr-2 active:bg-slate-200 dark:active:bg-slate-700"
      aria-label="Select date"
    >
      <CalendarDays className="w-4 h-4 text-slate-700 dark:text-slate-300" />
      <p className="text-slate-900 dark:text-slate-100 text-sm font-medium leading-normal">
        {displayText}
      </p>
    </button>
  );
}
