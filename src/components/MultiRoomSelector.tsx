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
    setExpandedEarlyLateIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleNightlyExpand = (idx: number) => {
    setExpandedNightlyIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-3">
      {/* Top Header Deck */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Layers size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                Cấu hình các phòng
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 tabular-nums">
                {rooms.length}/10 phòng
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Mỗi phòng có thể chọn chi nhánh, ngày lưu trú và tiện ích riêng biệt.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddRoom}
          disabled={rooms.length >= 10}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm",
            rooms.length >= 10
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
          )}
        >
          <Plus size={14} />
          <span>Thêm phòng</span>
        </button>
      </div>

      {/* List of room cards */}
      <div className="space-y-3">
        {rooms.map((roomItem, index) => {
          const filteredRooms = roomTypes.filter((r) => r.branchId === roomItem.branchId);
          const currentRoom = roomTypes.find((r) => r.id === roomItem.roomId);
          const currentBranch = branches.find((b) => b.id === roomItem.branchId);
          const itemCalc = summary.items[index]?.calculation;
          const isEarlyLateOpen = !!expandedEarlyLateIndices[index];
          const isNightlyOpen = !!expandedNightlyIndices[index];
          const isBranchDropdownOpen = openDropdownIndex?.index === index && openDropdownIndex?.type === 'branch';
          const isRoomDropdownOpen = openDropdownIndex?.index === index && openDropdownIndex?.type === 'room';

          return (
            <motion.div
              key={roomItem.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm relative transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => onUpdateRoom(index, { isIncluded: roomItem.isIncluded === false ? true : false })}
                    title={roomItem.isIncluded === false ? 'Bấm để tính vào đơn' : 'Bấm để tạm bỏ tính'}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                      roomItem.isIncluded !== false
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {roomItem.isIncluded !== false && <Check size={11} strokeWidth={3} />}
                  </button>

                  <span className="w-5 h-5 rounded font-bold text-xs flex items-center justify-center bg-slate-100 text-slate-700 shrink-0">
                    #{index + 1}
                  </span>

                  <span
                    className={cn(
                      "font-semibold text-xs sm:text-sm truncate",
                      roomItem.isIncluded !== false ? "text-slate-900" : "text-slate-400 line-through"
                    )}
                  >
                    {currentRoom?.name || 'Chưa chọn phòng'}
                  </span>

                  {itemCalc && (
                    <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded shrink-0 tabular-nums">
                      {itemCalc.nights.length} đêm
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {itemCalc && (
                    <div className="text-right mr-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Tạm tính</span>
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-bold tabular-nums",
                          roomItem.isIncluded !== false ? "text-slate-900" : "text-slate-400 line-through"
                        )}
                      >
                        {formatCurrency(itemCalc.finalTotal)}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onDuplicateRoom(index)}
                    disabled={rooms.length >= 10}
                    title="Nhân bản phòng"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Copy size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveRoom(index)}
                    disabled={rooms.length <= 1}
                    title="Xóa phòng"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:text-slate-200 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
                {/* Branch selector */}
                <div className="md:col-span-3 relative">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Cơ sở</label>
                  <button
                    type="button"
                    onClick={() => setOpenDropdownIndex(isBranchDropdownOpen ? null : { index, type: 'branch' })}
                    className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100/70 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors text-left"
                  >
                    <span className="truncate">{currentBranch?.name || 'Chọn chi nhánh'}</span>
                    <ChevronDown size={13} className={cn("text-slate-400 transition-transform shrink-0 ml-1", isBranchDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isBranchDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownIndex(null)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white shadow-lg rounded-xl border border-slate-200 p-1 z-50 overflow-hidden"
                        >
                          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                            {branches.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  const availableInNew = roomTypes.filter((r) => r.branchId === b.id);
                                  onUpdateRoom(index, {
                                    branchId: b.id,
                                    roomId: availableInNew[0]?.id || '',
                                  });
                                  setOpenDropdownIndex(null);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left",
                                  roomItem.branchId === b.id
                                    ? "bg-slate-900 text-white font-semibold"
                                    : "hover:bg-slate-100 text-slate-700"
                                )}
                              >
                                <span className="truncate">{b.name}</span>
                                {roomItem.branchId === b.id && <Check size={12} className="text-white shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Room type selector */}
                <div className="md:col-span-4 relative">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Hạng phòng</label>
                  <button
                    type="button"
                    onClick={() => setOpenDropdownIndex(isRoomDropdownOpen ? null : { index, type: 'room' })}
                    className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100/70 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors text-left"
                  >
                    <span className="truncate">{currentRoom?.name || 'Chọn hạng phòng'}</span>
                    <ChevronDown size={13} className={cn("text-slate-400 transition-transform shrink-0 ml-1", isRoomDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isRoomDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownIndex(null)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute top-full left-0 mt-1 w-full min-w-[240px] bg-white shadow-lg rounded-xl border border-slate-200 p-1 z-50 overflow-hidden"
                        >
                          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                            {filteredRooms.map((r) => (
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
                                    ? "bg-slate-900 text-white font-semibold"
                                    : "hover:bg-slate-100 text-slate-700"
                                )}
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-semibold">{r.name}</div>
                                  <div className={cn("text-[10px] tabular-nums", roomItem.roomId === r.id ? "text-slate-300" : "text-slate-400")}>
                                    {formatCurrency(r.weekdayPrice)}
                                  </div>
                                </div>
                                {roomItem.roomId === r.id && <Check size={12} className="text-white shrink-0 ml-1" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Date range picker */}
                <div className="md:col-span-5 relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-500">Thời gian lưu trú</label>
                    <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                      {itemCalc?.nights.length || 0} đêm
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDatePickerIndex(
                          openDatePickerIndex?.index === index && openDatePickerIndex?.type === 'checkIn'
                            ? null
                            : { index, type: 'checkIn' }
                        );
                      }}
                      className="flex-1 text-left px-2 py-1 rounded hover:bg-white transition-colors"
                    >
                      <div className="text-[10px] text-slate-400 font-medium">Nhận phòng</div>
                      <div className="text-xs font-semibold text-slate-800 tabular-nums">
                        {roomItem.checkIn ? format(parseISO(roomItem.checkIn), 'dd/MM/yyyy') : 'Chọn'}
                      </div>
                    </button>

                    <span className="text-slate-300 text-xs">→</span>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDatePickerIndex(
                          openDatePickerIndex?.index === index && openDatePickerIndex?.type === 'checkOut'
                            ? null
                            : { index, type: 'checkOut' }
                        );
                      }}
                      className="flex-1 text-left px-2 py-1 rounded hover:bg-white transition-colors"
                    >
                      <div className="text-[10px] text-slate-400 font-medium">Trả phòng</div>
                      <div className="text-xs font-semibold text-slate-800 tabular-nums">
                        {roomItem.checkOut ? format(parseISO(roomItem.checkOut), 'dd/MM/yyyy') : 'Chọn'}
                      </div>
                    </button>
                  </div>

                  {/* Calendar popup */}
                  <AnimatePresence>
                    {openDatePickerIndex?.index === index && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDatePickerIndex(null)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute top-full right-0 mt-1.5 bg-white shadow-xl rounded-xl border border-slate-200 p-3 z-50"
                        >
                          <FeatureBoundary>
                            <CalendarPicker
                              mode="single"
                              captionLayout="dropdown"
                              fromYear={2020}
                              toYear={2035}
                              selected={
                                openDatePickerIndex.type === 'checkIn'
                                  ? roomItem.checkIn
                                    ? parseISO(roomItem.checkIn)
                                    : undefined
                                  : roomItem.checkOut
                                    ? parseISO(roomItem.checkOut)
                                    : undefined
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
                            />
                          </FeatureBoundary>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom bar of the room card */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleEarlyLateExpand(index)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                      roomItem.earlyLateOptions.size > 0
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <Clock size={12} />
                    <span>Nhận sớm / trả muộn</span>
                    {roomItem.earlyLateOptions && roomItem.earlyLateOptions.size > 0 && (
                      <span className="w-4 h-4 rounded-full bg-white text-slate-900 text-[10px] flex items-center justify-center font-bold">
                        {roomItem.earlyLateOptions.size}
                      </span>
                    )}
                    <ChevronDown size={12} className={cn("transition-transform", isEarlyLateOpen && "rotate-180")} />
                  </button>

                  {itemCalc && (
                    <button
                      type="button"
                      onClick={() => toggleNightlyExpand(index)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <Calendar size={12} className="text-slate-400" />
                      <span>Xem từng đêm</span>
                      <ChevronDown size={12} className={cn("transition-transform", isNightlyOpen && "rotate-180")} />
                    </button>
                  )}
                </div>

                {itemCalc?.stayDiscount && (
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold tabular-nums">
                    {itemCalc.stayDiscount.name}: −{formatCurrency(itemCalc.stayDiscountValue)}
                  </span>
                )}
              </div>

              {/* Early / Late options expansion */}
              <AnimatePresence>
                {isEarlyLateOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2 pt-2 border-t border-slate-100"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-lg">
                      {EARLY_LATE_OPTIONS.map((option) => {
                        const checkOutDate = roomItem.checkOut ? parseISO(roomItem.checkOut) : null;
                        const isWeekendCheckout =
                          checkOutDate && isValid(checkOutDate)
                            ? getDay(checkOutDate) === 5 || getDay(checkOutDate) === 6
                            : false;
                        const isLate1800Disabled = option.type === 'late_1800' && isWeekendCheckout;
                        const isSelected =
                          !isLate1800Disabled &&
                          Boolean(roomItem.earlyLateOptions && roomItem.earlyLateOptions.has(option.type));

                        let displayPrice = '';
                        if (option.type === 'checkin_2200') {
                          displayPrice = formatCurrency(
                            Math.round(((itemCalc?.nights[0]?.finalPrice || 0) * 20) / 100)
                          );
                        } else if (option.type === 'early_0800') {
                          const basePrice = itemCalc?.previousNightPrice || currentRoom?.weekdayPrice || 0;
                          const value = Math.round((basePrice * (option.percentageRate || 50)) / 100);
                          displayPrice = formatCurrency(value);
                        } else if (option.type === 'late_1800') {
                          const basePrice = itemCalc?.nextNightPrice || currentRoom?.weekdayPrice || 0;
                          const value = Math.round((basePrice * (option.percentageRate || 80)) / 100);
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
                              "p-2 rounded-md border text-xs transition-colors flex items-center justify-between select-none",
                              isLate1800Disabled
                                ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                : isSelected
                                  ? "bg-slate-900 border-slate-900 text-white cursor-pointer"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 cursor-pointer"
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div
                                className={cn(
                                  "w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0",
                                  isSelected ? "bg-white border-white text-slate-900" : "border-slate-300 bg-white"
                                )}
                              >
                                {isSelected && <Check size={10} strokeWidth={3} />}
                              </div>
                              <span className={cn("truncate font-medium", isLate1800Disabled && "line-through")}>
                                {option.label}
                              </span>
                            </div>

                            <span
                              className={cn(
                                "text-[11px] font-bold shrink-0 ml-1 tabular-nums",
                                isLate1800Disabled
                                  ? "text-slate-400"
                                  : isSelected
                                    ? "text-white"
                                    : "text-slate-900"
                              )}
                            >
                              {isLate1800Disabled ? '—' : `${option.type === 'checkin_2200' ? '−' : '+'}${displayPrice}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nightly details breakdown expansion */}
              <AnimatePresence>
                {isNightlyOpen && itemCalc && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2 pt-2 border-t border-slate-100"
                  >
                    <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                      {itemCalc.nights.map((night, nIdx) => (
                        <div
                          key={nIdx}
                          className="flex justify-between items-center text-xs py-1 px-2 rounded bg-white border border-slate-200/60"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-800">
                              {format(parseISO(night.date), 'dd/MM')} ({night.isWeekend ? 'Cuối tuần' : 'Ngày thường'})
                            </span>
                            {night.adjustments.map((a, aIdx) => (
                              <span
                                key={aIdx}
                                className={cn(
                                  "text-[10px] px-1.5 rounded font-medium",
                                  a.type === 'surcharge' ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                                )}
                              >
                                {a.note || (a.type === 'surcharge' ? 'Phụ thu' : 'Giảm')}
                              </span>
                            ))}
                          </div>
                          <span className="font-semibold text-slate-900 tabular-nums">
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
