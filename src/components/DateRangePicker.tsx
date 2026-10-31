import { lazy } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { AnimatePresence } from 'motion/react';
import { AnimatedPanel } from './AnimatedPanel';
import { cn } from '../lib/utils';
import { CalculationResult } from './types';
import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { FeatureBoundary } from './FeatureBoundary';

const CalendarPicker = lazy(() => import('./CalendarPicker'));

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  showDatePicker: 'checkIn' | 'checkOut' | null;
  calculation: CalculationResult | null;
  onToggle: (type: 'checkIn' | 'checkOut') => void;
  onChange: (type: 'checkIn' | 'checkOut', date: string) => void;
  onClose: () => void;
}

export function DateRangePicker({
  checkIn,
  checkOut,
  showDatePicker,
  calculation,
  onToggle,
  onChange,
  onClose,
}: DateRangePickerProps) {
  const nightsCount = calculation?.nights.length || 0;

  return (
    <div className="relative p-3.5 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 h-5">
        <label className="text-xs font-medium text-slate-500">
          Thời gian lưu trú
        </label>
        <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
          {nightsCount} đêm
        </span>
      </div>

      {/* Control Box */}
      <div className="w-full h-12 px-2 bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-2 transition-colors">
        <div className="w-8 h-8 rounded-md bg-slate-200/60 flex items-center justify-center text-slate-700 shrink-0">
          <CalendarIcon size={16} />
        </div>

        {/* Check-in button */}
        <button
          type="button"
          onClick={() => onToggle('checkIn')}
          className={cn(
            "flex-1 text-left px-2 py-1 rounded transition-colors cursor-pointer",
            showDatePicker === 'checkIn'
              ? "bg-brand-700 text-white"
              : "hover:bg-slate-200/60 text-slate-800"
          )}
        >
          <div className={cn("text-[10px] font-medium leading-none", showDatePicker === 'checkIn' ? "text-slate-300" : "text-slate-400")}>
            Nhận phòng
          </div>
          <div className={cn("text-xs sm:text-sm font-bold tabular-nums leading-tight mt-0.5", showDatePicker === 'checkIn' ? "text-white" : "text-slate-900")}>
            {checkIn ? format(parseISO(checkIn), 'dd/MM/yyyy') : 'Chọn ngày'}
          </div>
        </button>

        <ArrowRight size={13} className="text-slate-300 shrink-0" />

        {/* Check-out button */}
        <button
          type="button"
          onClick={() => onToggle('checkOut')}
          className={cn(
            "flex-1 text-left px-2 py-1 rounded transition-colors cursor-pointer",
            showDatePicker === 'checkOut'
              ? "bg-brand-700 text-white"
              : "hover:bg-slate-200/60 text-slate-800"
          )}
        >
          <div className={cn("text-[10px] font-medium leading-none", showDatePicker === 'checkOut' ? "text-slate-300" : "text-slate-400")}>
            Trả phòng
          </div>
          <div className={cn("text-xs sm:text-sm font-bold tabular-nums leading-tight mt-0.5", showDatePicker === 'checkOut' ? "text-white" : "text-slate-900")}>
            {checkOut ? format(parseISO(checkOut), 'dd/MM/yyyy') : 'Chọn ngày'}
          </div>
        </button>
      </div>

      {/* Calendar Popover */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <AnimatedPanel
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-full mt-1.5 bg-white shadow-xl rounded-xl border border-slate-200 p-3 z-50",
                showDatePicker === 'checkIn' ? "left-0" : "right-0"
              )}
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 text-xs font-semibold text-slate-800">
                <CalendarIcon size={14} className="text-slate-500" />
                <span>{showDatePicker === 'checkIn' ? 'Chọn ngày nhận phòng' : 'Chọn ngày trả phòng'}</span>
              </div>
              <FeatureBoundary>
                <CalendarPicker
                  mode="single"
                  captionLayout="dropdown"
                  fromYear={2020}
                  toYear={2035}
                  selected={
                    showDatePicker === 'checkIn'
                      ? (checkIn ? parseISO(checkIn) : undefined)
                      : (checkOut ? parseISO(checkOut) : undefined)
                  }
                  onSelect={(date) => {
                    if (date) {
                      onChange(showDatePicker, format(date, 'yyyy-MM-dd'));
                      onClose();
                    }
                  }}
                  disabled={
                    showDatePicker === 'checkOut' && checkIn
                      ? { before: addDays(parseISO(checkIn), 1) }
                      : undefined
                  }
                />
              </FeatureBoundary>
            </AnimatedPanel>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
