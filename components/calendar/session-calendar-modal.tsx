'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSessionCalendar } from '@/hooks/use-session-calendar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface SessionCalendarModalProps {
  open: boolean;
  onClose: () => void;
  currentDate?: Date;
}

export function SessionCalendarModal({ open, onClose, currentDate = new Date() }: SessionCalendarModalProps) {
  const [viewDate, setViewDate] = useState(currentDate);
  const router = useRouter();
  const { toast } = useToast();

  const yearMonth = format(viewDate, 'yyyy-MM');
  const { sessionDates, loading } = useSessionCalendar(yearMonth);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const handlePrevMonth = () => {
    const newDate = subMonths(viewDate, 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(viewDate, 1);
    setViewDate(newDate);
  };

  const handleToday = () => {
    router.push('/dashboard');
    onClose();
  };

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const hasSession = sessionDates.includes(dateString);

    if (hasSession) {
      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      if (isToday) {
        router.push('/dashboard');
      } else {
        router.push(`/dashboard/history/${dateString}`);
      }
      onClose();
    } else {
      toast({
        description: 'No session on this date',
        duration: 2000,
      });
    }
  };

  // Calculate calendar grid
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 z-10" onClick={onClose}></div>

        {/* Calendar Modal */}
        <div
          aria-labelledby="calendar-heading"
          aria-modal="true"
          className="absolute top-0 left-0 right-0 z-20 h-[70vh] flex flex-col bg-[#F7F7F7] dark:bg-background-dark rounded-b-xl"
          role="dialog"
        >
        <div className="flex flex-col h-full">
          {/* Month Navigation */}
          <div className="flex items-center p-2 justify-between">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="flex size-12 items-center justify-center text-[#007AFF]"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2
              id="calendar-heading"
              className="text-[#333333] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center"
            >
              {format(viewDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="flex size-12 items-center justify-center text-[#007AFF]"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex flex-col items-center justify-start pt-4">
              <div className="grid grid-cols-7 w-full max-w-sm">
                {/* Day Headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <p
                    key={i}
                    aria-hidden="true"
                    className="text-[#8E8E93] dark:text-gray-400 text-xs font-bold leading-normal flex h-10 w-full items-center justify-center"
                  >
                    {day}
                  </p>
                ))}

                {/* Date Cells */}
                {calendarDays.map((day, i) => {
                  const dateString = format(day, 'yyyy-MM-dd');
                  const hasSession = sessionDates.includes(dateString);
                  const isToday = dateString === todayString;
                  const isSelected = isSameDay(day, currentDate);
                  const isCurrentMonth = isSameMonth(day, viewDate);

                  return (
                    <button
                      key={i}
                      onClick={() => isCurrentMonth && handleDateClick(day)}
                      disabled={!isCurrentMonth}
                      aria-label={`${format(day, 'MMMM d, yyyy')}${hasSession ? ', has sessions' : ''}${isToday ? ', today' : ''}${isSelected ? ', selected' : ''}`}
                      className={`h-12 w-full text-sm font-medium leading-normal relative ${
                        !isCurrentMonth
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-[#333333] dark:text-white'
                      }`}
                    >
                      <div
                        className={`flex size-full items-center justify-center rounded-full ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : isToday
                            ? 'border-2 border-[#007AFF] text-[#007AFF]'
                            : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      {hasSession && !isSelected && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-[#007AFF]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Today Button */}
          <div className="p-4 w-full">
            <Button
              onClick={handleToday}
              className="w-full h-12 bg-[#007AFF] hover:bg-blue-600 text-white text-base font-bold"
            >
              Today
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
