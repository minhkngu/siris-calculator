import { Hotel, ChevronDown, Check } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { AnimatedPanel } from './AnimatedPanel';
import { cn } from '../lib/utils';
import { RoomType } from './types';

interface RoomDropdownProps {
  roomTypes: RoomType[];
  selectedRoomId: string;
  showDropdown: boolean;
  onToggle: () => void;
  onSelect: (roomId: string) => void;
  formatCurrency: (amount: number) => string;
}

export function RoomDropdown({
  roomTypes,
  selectedRoomId,
  showDropdown,
  onToggle,
  onSelect,
  formatCurrency,
}: RoomDropdownProps) {
  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId);

  return (
    <div className="relative p-3.5 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 h-5">
        <label className="text-xs font-medium text-slate-500">
          Hạng phòng
        </label>
        <span className="text-[11px] font-medium text-slate-400 tabular-nums">
          {roomTypes.length} hạng phòng
        </span>
      </div>

      {/* Control Box */}
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={showDropdown}
        className={cn(
          "w-full h-12 px-3 bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer group",
          showDropdown && "bg-white border-brand-700 ring-1 ring-brand-700"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div className="w-8 h-8 rounded-md bg-slate-200/60 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-200 transition-colors">
            <Hotel size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight">
              {selectedRoom?.name || 'Chọn hạng phòng'}
            </div>
            <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5 tabular-nums">
              {selectedRoomId ? (
                <span>
                  CN–T5: {formatCurrency(selectedRoom?.weekdayPrice || 0)} · T6–T7: {formatCurrency(selectedRoom?.weekendPrice || 0)}
                </span>
              ) : (
                'Bảng giá phòng lưu trú'
              )}
            </div>
          </div>
        </div>
        <ChevronDown
          size={15}
          className={cn(
            "text-slate-400 group-hover:text-slate-600 transition-transform duration-150 shrink-0 ml-1",
            showDropdown && "rotate-180 text-slate-900"
          )}
        />
      </button>

      {/* Popover Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={onToggle} />
            <AnimatedPanel
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1.5 w-full min-w-[300px] bg-white shadow-xl rounded-xl border border-slate-200 p-1.5 z-50 overflow-hidden"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Danh sách hạng phòng
              </div>
              <div className="max-h-[280px] overflow-y-auto custom-scrollbar space-y-1">
                {roomTypes.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs italic">
                    Cơ sở này hiện chưa có loại phòng nào.
                  </div>
                ) : (
                  roomTypes.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          onSelect(room.id);
                          onToggle();
                        }}
                        className={cn(
                          "w-full p-2.5 rounded-lg transition-colors text-left cursor-pointer border",
                          isSelected
                            ? "bg-slate-50 border-slate-300 shadow-xs"
                            : "border-transparent hover:bg-slate-50 hover:border-slate-200/60"
                        )}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={cn("text-xs sm:text-sm font-bold", isSelected ? "text-slate-900" : "text-slate-800")}>
                            {room.name}
                          </span>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-brand-700 text-white flex items-center justify-center shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          CN–T5: {formatCurrency(room.weekdayPrice)} · T6–T7: {formatCurrency(room.weekendPrice)}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </AnimatedPanel>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
