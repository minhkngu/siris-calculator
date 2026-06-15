import { ChevronDown, Percent, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GlobalAdjustment } from '../components/types';

interface GlobalAdjustmentControlProps {
    globalAdjustment: GlobalAdjustment;
    showDropdown: boolean;
    onToggleDropdown: () => void;
    onCloseDropdown: () => void;
    onTypeChange: (type: 'surcharge' | 'discount') => void;
    onAmountChange: (amount: number) => void;
    onTogglePercentage: () => void;
}

export function GlobalAdjustmentControl({
    globalAdjustment,
    showDropdown,
    onToggleDropdown,
    onCloseDropdown,
    onTypeChange,
    onAmountChange,
    onTogglePercentage,
}: GlobalAdjustmentControlProps) {
    return (
        <div className="p-3 lg:p-4">
            <label className="block text-[10px] sm:text-[11px] uppercase font-bold text-zinc-400 mb-1.5 sm:mb-2 tracking-wider">Điều chỉnh tổng đơn</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex-1 flex items-center bg-white rounded-xl sm:rounded-2xl border border-zinc-200 p-1 group hover:border-indigo-300 transition-all shadow-sm">
                    <div className="relative">
                        <button
                            onClick={onToggleDropdown}
                            className="bg-indigo-50 text-[11px] font-black text-indigo-700 outline-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl pr-8 sm:pr-10 cursor-pointer hover:bg-indigo-100 transition-colors flex items-center gap-2 sm:gap-3 min-w-[100px] sm:min-w-[140px] relative uppercase tracking-tight whitespace-nowrap"
                        >
                            <div className={cn(
                                "w-2 h-2 rounded-full shadow-sm shrink-0",
                                globalAdjustment.type === 'surcharge' ? "bg-rose-500" : "bg-emerald-500"
                            )} />
                            <span className="text-[11px] sm:text-xs">{globalAdjustment.type === 'surcharge' ? 'Phụ thu' : 'Giảm giá'}</span>
                            <ChevronDown size={14} className={cn("absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-indigo-500 transition-transform shrink-0", showDropdown && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {showDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={onCloseDropdown} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 w-48 bg-white shadow-2xl rounded-2xl border border-zinc-200 p-1.5 z-50"
                                    >
                                        <button
                                            onClick={() => { onTypeChange('surcharge'); onCloseDropdown(); }}
                                            className={cn(
                                                "w-full text-left px-3 py-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-3",
                                                globalAdjustment.type === 'surcharge' ? "bg-rose-50 text-rose-700" : "text-zinc-600 hover:bg-zinc-50"
                                            )}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            Phụ thu
                                        </button>
                                        <button
                                            onClick={() => { onTypeChange('discount'); onCloseDropdown(); }}
                                            className={cn(
                                                "w-full text-left px-3 py-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-3",
                                                globalAdjustment.type === 'discount' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
                                            )}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Giảm giá
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <input
                        type="number"
                        value={globalAdjustment.amount === 0 ? '' : globalAdjustment.amount}
                        onChange={(e) => onAmountChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full min-w-0 bg-transparent px-3 sm:px-4 py-2 sm:py-1 text-sm sm:text-base font-black text-zinc-900 outline-none placeholder:text-zinc-300"
                        placeholder="0"
                    />
                    <button
                        onClick={onTogglePercentage}
                        className={cn(
                            "w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl transition-all shadow-sm shrink-0",
                            globalAdjustment.isPercentage ? "bg-indigo-600 text-white" : "bg-white text-zinc-400 border border-zinc-200"
                        )}
                        style={{ minWidth: '40px', minHeight: '40px' }}
                    >
                        {globalAdjustment.isPercentage ? <Percent size={18} /> : <DollarSign size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}