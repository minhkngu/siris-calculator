import { Hotel, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

export function RoomDropdown({ roomTypes, selectedRoomId, showDropdown, onToggle, onSelect, formatCurrency }: RoomDropdownProps) {
    const selectedRoom = roomTypes.find(r => r.id === selectedRoomId);

    return (
        <div className="relative p-3 lg:p-4">
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">Loại phòng</label>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-zinc-100 text-zinc-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Hotel size={16} />
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">
                            {selectedRoom?.name || 'Chọn loại phòng'}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex gap-2">
                            {selectedRoomId ? (
                                <>
                                    <span>CN-T5: {formatCurrency(selectedRoom?.weekdayPrice || 0)}</span>
                                    <span className="opacity-30">|</span>
                                    <span>T6-T7: {formatCurrency(selectedRoom?.weekendPrice || 0)}</span>
                                </>
                            ) : 'Giá phòng'}
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", showDropdown && "rotate-180")} />
            </button>

            <AnimatePresence>
                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={onToggle} />
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white shadow-2xl rounded-2xl border border-zinc-200 p-2 z-50 overflow-hidden"
                        >
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {roomTypes.length === 0 ? (
                                    <div className="p-4 text-center text-zinc-400 text-xs italic">
                                        Cơ sở này chưa có loại phòng nào.
                                    </div>
                                ) : (
                                    roomTypes.map((room) => (
                                        <button
                                            key={room.id}
                                            onClick={() => {
                                                onSelect(room.id);
                                                onToggle();
                                            }}
                                            className={cn(
                                                "w-full p-3 rounded-xl transition-all text-left mb-1 last:mb-0 border",
                                                selectedRoomId === room.id
                                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                                                    : "border-transparent hover:bg-zinc-50 text-zinc-600"
                                            )}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">{room.name}</span>
                                                {selectedRoomId === room.id && <Check size={14} />}
                                            </div>
                                            <div className="flex gap-3 mt-1 opacity-70">
                                                <span className="text-[10px]">CN-T5: {formatCurrency(room.weekdayPrice)}</span>
                                                <span className="text-[10px]">T6-T7: {formatCurrency(room.weekendPrice)}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}