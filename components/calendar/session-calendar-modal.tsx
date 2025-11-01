'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="top-0 translate-y-0 rounded-b-xl rounded-t-none max-w-md h-[70vh] p-0 gap-0"
        aria-labelledby="calendar-heading"
      >
        {/* Content will be added in next steps */}
      </DialogContent>
    </Dialog>
  );
}
