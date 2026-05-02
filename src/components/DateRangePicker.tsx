import { format, addDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CalculationResult } from './types';

interface DateRangePickerProps {
    checkIn: string;
    checkOut: string;
    showDatePicker: 'checkIn' | 'checkOut' | null;
    calculation: CalculationResult | null;
    onToggle: (type: 'checkIn' | 'checkOut') => void;
    onChange: (type: 'checkIn' | 'checkOut', date: string) => void;
    onClose: () => void;
}

export function DateRangePicker({ checkIn, checkOut, showDatePicker, calculation, onToggle, onChange, onClose }: DateRangePickerProps) {
    return (
        <div className="p-3 lg:p-4 relative">
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">
                Thời gian lưu trú
            </label>
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-zinc-200 hover:border-indigo-200 transition-all shadow-sm">
                <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-200 overflow-hidden">
                    <button
                        onClick={() => onToggle('checkIn')}
                        className="px-3 text-left group"
                    >
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Nhận phòng</div>
                        <div className="text-[13px] sm:text-sm font-black text-zinc-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                            {checkIn ? format(parseISO(checkIn), 'dd/MM/yyyy') : 'Chọn'}
                        </div>
                    </button>
                    <button
                        onClick={() => onToggle('checkOut')}
                        className="px-3 text-left group"
                    >
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Trả phòng</div>
                        <div className="text-[13px] sm:text-sm font-black text-zinc-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                            {checkOut ? format(parseISO(checkOut), 'dd/MM/yyyy') : 'Chọn'}
                        </div>
                    </button>
                </div>
                <div className="w-9 h-9 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <div className="text-center">
                        <div className="text-[10px] font-black leading-none">{calculation?.nights.length || 0}</div>
                        <div className="text-[7px] uppercase font-bold">đêm</div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showDatePicker && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={onClose} />
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={cn(
                                "absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl rounded-2xl border border-zinc-200 p-4 z-50 flex justify-center",
                                showDatePicker === 'checkIn' ? "md:left-0 md:right-auto" : "md:right-0 md:left-auto"
                            )}
                        >
                            <DayPicker
                                mode="single"
                                captionLayout="dropdown"
                                fromYear={2024}
                                toYear={2030}
                                selected={showDatePicker === 'checkIn' ? (checkIn ? parseISO(checkIn) : undefined) : (checkOut ? parseISO(checkOut) : undefined)}
                                onSelect={(date) => {
                                    if (date) {
                                        onChange(showDatePicker, format(date, 'yyyy-MM-dd'));
                                        onClose();
                                    }
                                }}
                                locale={vi}
                                disabled={showDatePicker === 'checkOut' && checkIn ? { before: addDays(parseISO(checkIn), 1) } : { before: new Date() }}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}