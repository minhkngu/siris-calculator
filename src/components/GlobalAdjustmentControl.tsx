import { Check, ChevronDown, Percent, DollarSign } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { AnimatedPanel } from './AnimatedPanel';
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
    includeVAT: boolean;
    vatRate: number;
    onToggleVAT: (checked: boolean) => void;
    onVatRateChange: (rate: number) => void;
}

export function GlobalAdjustmentControl({
    globalAdjustment,
    showDropdown,
    onToggleDropdown,
    onCloseDropdown,
    onTypeChange,
    onAmountChange,
    onTogglePercentage,
    includeVAT,
    vatRate,
    onToggleVAT,
    onVatRateChange,
}: GlobalAdjustmentControlProps) {
    return (
        <div className="p-3 lg:p-4">
            <label className="block text-[10px] sm:text-[11px] uppercase font-bold text-zinc-400 mb-1.5 sm:mb-2 tracking-wider">Điều chỉnh tổng đơn</label>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-0 flex-[2_1_210px] items-center bg-white rounded-xl sm:rounded-2xl border border-zinc-200 p-1 group hover:border-indigo-300 transition-all shadow-sm">
                    <div className="relative">
                        <button
                            onClick={onToggleDropdown}
                            className="bg-indigo-50 text-[11px] font-black text-indigo-700 outline-none px-3 py-2.5 sm:py-2 rounded-lg sm:rounded-xl pr-8 cursor-pointer hover:bg-indigo-100 transition-colors flex items-center gap-2 min-w-[100px] sm:min-w-[120px] relative uppercase tracking-tight whitespace-nowrap"
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
                                    <AnimatedPanel
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
                                    </AnimatedPanel>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <input
                        type="number"
                        aria-label="Giá trị điều chỉnh"
                        value={globalAdjustment.amount === 0 ? '' : globalAdjustment.amount}
                        onChange={(e) => onAmountChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full min-w-0 bg-transparent px-2 sm:px-3 py-2 sm:py-1 text-sm sm:text-base font-black text-zinc-900 outline-none placeholder:text-zinc-300"
                        placeholder="0"
                    />
                    <button
                        aria-label="Chuyển đơn vị điều chỉnh"
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
                <div className="flex min-w-0 flex-[1_1_150px] items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm transition-colors hover:border-indigo-300 sm:rounded-2xl">
                    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-indigo-50 px-3 text-xs font-bold text-indigo-700 sm:rounded-xl">
                        <input type="checkbox" checked={includeVAT} onChange={event => onToggleVAT(event.target.checked)} className="peer sr-only" />
                        <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500', includeVAT ? 'border-indigo-600 bg-indigo-600' : 'border-indigo-300 bg-white')}><Check size={12} className={includeVAT ? 'text-white' : 'invisible'} strokeWidth={3} /></span>
                        <span>VAT</span>
                    </label>
                    <input type="text" inputMode="decimal" aria-label="Thuế VAT phần trăm" disabled={!includeVAT} value={vatRate === 0 ? '' : vatRate} onChange={event => onVatRateChange(event.target.value === '' ? 0 : Number(event.target.value))} className="w-full min-w-0 bg-transparent px-2 text-sm font-bold text-zinc-900 outline-none disabled:text-zinc-400" />
                    <span aria-hidden="true" className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl', includeVAT ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400')}><Percent size={18} /></span>
                </div>
            </div>
        </div>
    );
}
