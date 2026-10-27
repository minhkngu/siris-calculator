import { lazy, useState } from 'react';
import { Plus, Trash2, Copy, Building, Hotel, Calendar, Clock, ChevronDown, ChevronUp, Layers, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Branch, RoomType, SelectedRoomItem, EarlyCheckinLateCheckoutType, EARLY_LATE_OPTIONS, MultiRoomTotalSummary } from './types';
import { cn } from '../lib/utils';
import { format, parseISO, addDays, getDay, isValid } from 'date-fns';

import { FeatureBoundary } from './FeatureBoundary';
const CalendarPicker = lazy(() => import('./CalendarPicker'));

interface MultiRoomSelectorProps {
    rooms: SelectedRoomItem[];
    branches: Branch[];
    roomTypes: RoomType[];
    summary: MultiRoomTotalSummary;
    onAddRoom: () => void;
    onDuplicateRoom: (index: number) => void;
    onRemoveRoom: (index: number) => void;
    onUpdateRoom: (index: number, updates: Partial<SelectedRoomItem>) => void;
    onToggleEarlyLate: (index: number, type: EarlyCheckinLateCheckoutType) => void;
    formatCurrency: (amount: number) => string;
}

export function MultiRoomSelector({
    rooms,
    branches,
    roomTypes,
    summary,
    onAddRoom,
    onDuplicateRoom,
    onRemoveRoom,
    onUpdateRoom,
    onToggleEarlyLate,
    formatCurrency,
}: MultiRoomSelectorProps) {
    const [openDatePickerIndex, setOpenDatePickerIndex] = useState<{ index: number; type: 'checkIn' | 'checkOut' } | null>(null);
    const [expandedEarlyLateIndices, setExpandedEarlyLateIndices] = useState<Record<number, boolean>>({});
    const [expandedNightlyIndices, setExpandedNightlyIndices] = useState<Record<number, boolean>>({});

    const [openDropdownIndex, setOpenDropdownIndex] = useState<{ index: number; type: 'branch' | 'room' } | null>(null);

    const toggleEarlyLateExpand = (idx: number) => {
        setExpandedEarlyLateIndices(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleNightlyExpand = (idx: number) => {
        setExpandedNightlyIndices(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-row items-center justify-between gap-2 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl shrink-0">
                        <Layers size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xs sm:text-base font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 truncate">
                            <span>Phòng đã chọn</span>
                            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                                {rooms.length}/10
                            </span>
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">
                            Cấu hình từng phòng với loại phòng, thời gian lưu trú và dịch vụ riêng biệt.
                        </p>
                    </div>
                </div>

                <button
                    onClick={onAddRoom}
                    disabled={rooms.length >= 10}
                    className={cn(
                        "flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0",
                        rooms.length >= 10
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow"
                    )}
                >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                    <span>Thêm phòng</span>
                </button>
            </div>

            {/* List of room cards */}
            <div className="space-y-3 sm:space-y-4">
                {rooms.map((roomItem, index) => {
                    const filteredRooms = roomTypes.filter(r => r.branchId === roomItem.branchId);
                    const currentRoom = roomTypes.find(r => r.id === roomItem.roomId);
                    const currentBranch = branches.find(b => b.id === roomItem.branchId);
                    const itemCalc = summary.items[index]?.calculation;
                    const isEarlyLateOpen = !!expandedEarlyLateIndices[index];
                    const isNightlyOpen = !!expandedNightlyIndices[index];
                    const isBranchDropdownOpen = openDropdownIndex?.index === index && openDropdownIndex?.type === 'branch';
                    const isRoomDropdownOpen = openDropdownIndex?.index === index && openDropdownIndex?.type === 'room';

                    return (
                        <motion.div
                            key={roomItem.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm p-3 sm:p-5 transition-all relative"
                        >
                            {/* Card Top bar */}
                            <div className="flex items-center justify-between gap-1.5 pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b border-slate-100">
                                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateRoom(index, { isIncluded: roomItem.isIncluded === false ? true : false })}
                                        title={roomItem.isIncluded === false ? "Nhấp để tính vào tổng đơn" : "Nhấp để bỏ qua không tính vào tổng đơn"}
                                        className={cn(
                                            "w-4 h-4 sm:w-5 sm:h-5 rounded sm:rounded-[6px] border flex items-center justify-center transition-all cursor-pointer shrink-0",
                                            roomItem.isIncluded !== false
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                                : "border-slate-300 bg-white hover:border-indigo-400"
                                        )}
                                    >
                                        {roomItem.isIncluded !== false && (
                                            <span className="text-[10px] sm:text-xs font-black">✓</span>
                                        )}
                                    </button>

                                    <span className={cn(
                                        "w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg font-bold text-[10px] sm:text-xs flex items-center justify-center shadow-sm shrink-0",
                                        roomItem.isIncluded !== false
                                            ? "bg-indigo-600 text-white shadow-indigo-200"
                                            : "bg-slate-200 text-slate-500"
                                    )}>
                                        #{index + 1}
                                    </span>
                                    <span className={cn(
                                        "font-bold text-xs sm:text-base transition-colors truncate max-w-[120px] sm:max-w-[200px]",
                                        roomItem.isIncluded !== false ? "text-slate-800" : "text-slate-400 line-through"
                                    )}>
                                        {currentRoom?.name || 'Chưa chọn loại phòng'}
                                    </span>
                                    {itemCalc && (
                                        <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-600 font-semibold px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                                            {itemCalc.nights.length}đ
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                    {itemCalc && (
                                        <div className="text-right mr-0.5 sm:mr-1">
                                            <span className="text-[9px] sm:text-xs text-slate-400 block font-medium">Tạm tính</span>
                                            <span className={cn(
                                                "text-xs sm:text-base font-black",
                                                roomItem.isIncluded !== false ? "text-indigo-600" : "text-slate-400 line-through"
                                            )}>
                                                {formatCurrency(itemCalc.finalTotal)}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => onDuplicateRoom(index)}
                                        disabled={rooms.length >= 10}
                                        title="Nhân bản phòng này"
                                        className={cn(
                                            "p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all",
                                            rooms.length >= 10
                                                ? "text-slate-300 cursor-not-allowed"
                                                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                        )}
                                    >
                                        <Copy size={14} className="sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                        onClick={() => onRemoveRoom(index)}
                                        disabled={rooms.length <= 1}
                                        title="Xoá phòng"
                                        className={cn(
                                            "p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all",
                                            rooms.length <= 1
                                                ? "text-slate-300 cursor-not-allowed"
                                                : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                        )}
                                    >
                                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Configuration Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                                {/* Custom Branch selector */}
                                <div className="md:col-span-3 p-2 sm:p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 relative">
                                    <label className="block text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider flex items-center gap-1">
                                        <Building size={11} className="text-indigo-500" />
                                        Cơ sở
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setOpenDropdownIndex(isBranchDropdownOpen ? null : { index, type: 'branch' })}
                                        className="w-full bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2 py-1 sm:py-1.5 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors text-left"
                                    >
                                        <span className="truncate">{currentBranch?.name || 'Chọn cơ sở'}</span>
                                        <ChevronDown size={13} className={cn("text-slate-400 transition-transform shrink-0 ml-1", isBranchDropdownOpen && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {isBranchDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownIndex(null)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute top-full left-0 mt-1.5 w-full min-w-[200px] bg-white shadow-xl rounded-xl border border-slate-200 p-1.5 z-50 overflow-hidden"
                                                >
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                                                        {branches.map(b => (
                                                            <button
                                                                key={b.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    const availableInNew = roomTypes.filter(r => r.branchId === b.id);
                                                                    onUpdateRoom(index, {
                                                                        branchId: b.id,
                                                                        roomId: availableInNew[0]?.id || ''
                                                                    });
                                                                    setOpenDropdownIndex(null);
                                                                }}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left",
                                                                    roomItem.branchId === b.id
                                                                        ? "bg-indigo-50 text-indigo-700 font-bold"
                                                                        : "hover:bg-slate-50 text-slate-700"
                                                                )}
                                                            >
                                                                <span className="truncate">{b.name}</span>
                                                                {roomItem.branchId === b.id && <Check size={12} className="text-indigo-600 shrink-0" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Custom Room type selector */}
                                <div className="md:col-span-4 p-2 sm:p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 relative">
                                    <label className="block text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider flex items-center gap-1">
                                        <Hotel size={11} className="text-indigo-500" />
                                        Loại phòng
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setOpenDropdownIndex(isRoomDropdownOpen ? null : { index, type: 'room' })}
                                        className="w-full bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2 py-1 sm:py-1.5 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors text-left"
                                    >
                                        <span className="truncate">{currentRoom?.name || 'Chọn phòng'}</span>
                                        <ChevronDown size={13} className={cn("text-slate-400 transition-transform shrink-0 ml-1", isRoomDropdownOpen && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {isRoomDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownIndex(null)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute top-full left-0 mt-1.5 w-full min-w-[240px] bg-white shadow-xl rounded-xl border border-slate-200 p-1.5 z-50 overflow-hidden"
                                                >
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                                                        {filteredRooms.map(r => (
                                                            <button
                                                                key={r.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    onUpdateRoom(index, { roomId: r.id });
                                                                    setOpenDropdownIndex(null);
                                                                }}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left",
                                                                    roomItem.roomId === r.id
                                                                        ? "bg-indigo-50 text-indigo-700 font-bold"
                                                                        : "hover:bg-slate-50 text-slate-700"
                                                                )}
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="truncate font-semibold">{r.name}</div>
                                                                    <div className="text-[10px] text-slate-400">{formatCurrency(r.weekdayPrice)}</div>
                                                                </div>
                                                                {roomItem.roomId === r.id && <Check size={12} className="text-indigo-600 shrink-0 ml-1" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>


                                {/* Date Range */}
                                <div className="md:col-span-5 p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 relative">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={12} className="text-indigo-500" />
                                            Thời gian lưu trú
                                        </span>
                                        <span className="font-bold text-indigo-600 lowercase">{itemCalc?.nights.length || 0} đêm</span>
                                    </label>
                                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (openDatePickerIndex?.index === index && openDatePickerIndex?.type === 'checkIn') {
                                                    setOpenDatePickerIndex(null);
                                                } else {
                                                    setOpenDatePickerIndex({ index, type: 'checkIn' });
                                                }
                                            }}
                                            className="flex-1 text-left px-2 py-0.5 rounded hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Nhận phòng</div>
                                            <div className="text-[12px] font-bold text-slate-800 truncate">
                                                {roomItem.checkIn ? format(parseISO(roomItem.checkIn), 'dd/MM/yyyy') : 'Chọn'}
                                            </div>
                                        </button>
                                        <span className="text-slate-300 text-xs">→</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (openDatePickerIndex?.index === index && openDatePickerIndex?.type === 'checkOut') {
                                                    setOpenDatePickerIndex(null);
                                                } else {
                                                    setOpenDatePickerIndex({ index, type: 'checkOut' });
                                                }
                                            }}
                                            className="flex-1 text-left px-2 py-0.5 rounded hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Trả phòng</div>
                                            <div className="text-[12px] font-bold text-slate-800 truncate">
                                                {roomItem.checkOut ? format(parseISO(roomItem.checkOut), 'dd/MM/yyyy') : 'Chọn'}
                                            </div>
                                        </button>
                                    </div>

                                    {/* Date picker modal */}
                                    <AnimatePresence>
                                        {openDatePickerIndex?.index === index && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setOpenDatePickerIndex(null)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full right-0 mt-2 bg-white shadow-2xl rounded-2xl border border-slate-200 p-4 z-50 flex justify-center"
                                                >
                                                    <FeatureBoundary><CalendarPicker
                                                        mode="single"
                                                        captionLayout="dropdown"
                                                        fromYear={2020}
                                                        toYear={2035}
                                                        selected={
                                                            openDatePickerIndex.type === 'checkIn'
                                                                ? (roomItem.checkIn ? parseISO(roomItem.checkIn) : undefined)
                                                                : (roomItem.checkOut ? parseISO(roomItem.checkOut) : undefined)
                                                        }
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                const formatted = format(date, 'yyyy-MM-dd');
                                                                if (openDatePickerIndex.type === 'checkIn') {
                                                                    onUpdateRoom(index, { checkIn: formatted });
                                                                } else {
                                                                    onUpdateRoom(index, { checkOut: formatted });
                                                                }
                                                                setOpenDatePickerIndex(null);
                                                            }
                                                        }}

                                                        disabled={
                                                            openDatePickerIndex.type === 'checkOut' && roomItem.checkIn
                                                                ? { before: addDays(parseISO(roomItem.checkIn), 1) }
                                                                : undefined
                                                        }
                                                    /></FeatureBoundary>

                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>



                            {/* Collapsible Sections: Early/Late and Nightly Breakdown */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleEarlyLateExpand(index)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer border",
                                            roomItem.earlyLateOptions.size > 0
                                                ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <Clock size={13} className="text-blue-500" />
                                        <span>Tùy chọn Check-in / Check-out</span>
                                        {roomItem.earlyLateOptions && roomItem.earlyLateOptions.size > 0 && (
                                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                                                {roomItem.earlyLateOptions.size}
                                            </span>
                                        )}

                                        {isEarlyLateOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>

                                    {itemCalc && (
                                        <button
                                            type="button"
                                            onClick={() => toggleNightlyExpand(index)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-medium cursor-pointer"
                                        >
                                            <Calendar size={13} className="text-indigo-500" />
                                            <span>Chi tiết từng đêm</span>
                                            {isNightlyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    )}
                                </div>

                                {itemCalc?.stayDiscount && (
                                    <div className="text-xs text-indigo-600 bg-indigo-50 font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
                                        {itemCalc.stayDiscount.name}: -{formatCurrency(itemCalc.stayDiscountValue)}
                                    </div>
                                )}
                            </div>

                            {/* Early / Late Check-in options expanded */}
                            <AnimatePresence>
                                {isEarlyLateOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mt-3"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                                            {EARLY_LATE_OPTIONS.map((option) => {
                                                const checkOutDate = roomItem.checkOut ? parseISO(roomItem.checkOut) : null;
                                                const isWeekendCheckout = checkOutDate && isValid(checkOutDate)
                                                    ? (getDay(checkOutDate) === 5 || getDay(checkOutDate) === 6)
                                                    : false;
                                                const isLate1800Disabled = option.type === 'late_1800' && isWeekendCheckout;
                                                const isSelected = !isLate1800Disabled && Boolean(roomItem.earlyLateOptions && typeof roomItem.earlyLateOptions.has === 'function' && roomItem.earlyLateOptions.has(option.type));

                                                let displayPrice = '';
                                                if (option.type === 'checkin_2200') {
                                                    displayPrice = formatCurrency(Math.round((itemCalc?.nights[0]?.finalPrice || 0) * 20 / 100));
                                                } else if (option.type === 'early_0800') {
                                                    const basePrice = itemCalc?.previousNightPrice || currentRoom?.weekdayPrice || 0;
                                                    const value = Math.round(basePrice * (option.percentageRate || 50) / 100);
                                                    displayPrice = formatCurrency(value);
                                                } else if (option.type === 'late_1800') {
                                                    const basePrice = itemCalc?.nextNightPrice || currentRoom?.weekdayPrice || 0;
                                                    const value = Math.round(basePrice * (option.percentageRate || 80) / 100);
                                                    displayPrice = formatCurrency(value);
                                                } else {
                                                    displayPrice = formatCurrency(option.price || 0);
                                                }

                                                return (
                                                    <div
                                                        key={option.type}
                                                        onClick={() => {
                                                            if (!isLate1800Disabled) {
                                                                onToggleEarlyLate(index, option.type);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "p-2.5 rounded-lg border text-xs transition-all select-none flex items-center justify-between",
                                                            isLate1800Disabled
                                                                ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-65"
                                                                : isSelected
                                                                    ? "bg-blue-50/80 border-blue-500 text-blue-900 shadow-sm cursor-pointer"
                                                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 cursor-pointer"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border transition-colors shrink-0",
                                                                isLate1800Disabled
                                                                    ? "border-slate-200 bg-slate-200/60 text-transparent"
                                                                    : isSelected
                                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                                        : "border-slate-300 bg-white"
                                                            )}>
                                                                {isSelected ? '✓' : ''}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className={cn("font-medium", isLate1800Disabled && "text-slate-400 line-through decoration-slate-300")}>
                                                                        {option.label}
                                                                    </span>
                                                                    {isLate1800Disabled && (
                                                                        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                                            Không áp dụng T6, T7
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isLate1800Disabled ? (
                                                            <span className="text-slate-400 font-medium text-[11px] shrink-0">
                                                                Không hỗ trợ
                                                            </span>
                                                        ) : (
                                                            <span className="font-bold text-slate-600 text-[11px] shrink-0">
                                                                {option.type === 'checkin_2200' ? '−' : '+'}{displayPrice}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Nightly Details Expanded */}
                            <AnimatePresence>
                                {isNightlyOpen && itemCalc && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mt-3"
                                    >
                                        <div className="bg-slate-50 rounded-xl p-3 space-y-1 border border-slate-200/60">
                                            {itemCalc.nights.map((night, nIdx) => (
                                                <div key={nIdx} className="flex justify-between items-center text-xs py-1 px-2 rounded bg-white border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-700">
                                                            {format(parseISO(night.date), 'dd/MM')} ({night.isWeekend ? 'T6-T7' : 'CN-T5'})
                                                        </span>
                                                        {night.adjustments.map((a, aIdx) => (
                                                            <span key={aIdx} className={cn(
                                                                "text-[10px] px-1.5 py-0.5 rounded font-semibold",
                                                                a.type === 'surcharge' ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                                                            )}>
                                                                {a.note || (a.type === 'surcharge' ? 'Phụ thu' : 'Giảm')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="font-bold text-slate-900">
                                                        {formatCurrency(night.finalPrice)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
