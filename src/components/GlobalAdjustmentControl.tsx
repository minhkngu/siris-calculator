import { ChevronDown, Plus, Minus } from 'lucide-react';
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
  const isSurcharge = globalAdjustment.type === 'surcharge';

  return (
    <div className="relative p-3.5 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 h-5">
        <label className="text-xs font-medium text-slate-500">
          Điều chỉnh đơn
        </label>

      </div>

      {/* Control Box */}
      <div className="w-full h-12 px-2 bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-2 transition-colors focus-within:bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
        {/* Type Selector Dropdown Trigger */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onToggleDropdown}
            className={cn(
              "h-8 px-2.5 rounded-md text-xs font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5",
              isSurcharge
                ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", isSurcharge ? "bg-amber-600" : "bg-emerald-600")} />
            <span>{isSurcharge ? 'Phụ thu' : 'Giảm giá'}</span>
            <ChevronDown size={13} className={cn("transition-transform duration-150 ml-0.5", showDropdown && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={onCloseDropdown} />
                <AnimatedPanel
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 w-44 bg-white shadow-xl rounded-xl border border-slate-200 p-1.5 z-50 overflow-hidden"
                >
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Loại điều chỉnh
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTypeChange('surcharge');
                      onCloseDropdown();
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer",
                      isSurcharge ? "bg-amber-50 text-amber-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Plus size={12} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-semibold">Phụ thu (+)</div>
                        <div className="text-[10px] text-slate-400">Cộng thêm vào tổng</div>
                      </div>
                    </div>
                    {isSurcharge && <Check size={14} className="text-amber-700 shrink-0" strokeWidth={2.5} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTypeChange('discount');
                      onCloseDropdown();
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer mt-0.5",
                      !isSurcharge ? "bg-emerald-50 text-emerald-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Minus size={12} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-semibold">Giảm giá (−)</div>
                        <div className="text-[10px] text-slate-400">Trừ bớt vào tổng</div>
                      </div>
                    </div>
                    {!isSurcharge && <Check size={14} className="text-emerald-700 shrink-0" strokeWidth={2.5} />}
                  </button>
                </AnimatedPanel>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Amount Input */}
        <input
          type="text"
          inputMode="numeric"
          aria-label="Giá trị điều chỉnh"
          value={
            globalAdjustment.amount === 0
              ? ''
              : globalAdjustment.isPercentage
                ? globalAdjustment.amount
                : globalAdjustment.amount.toLocaleString('vi-VN')
          }
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            const num = raw === '' ? 0 : Number(raw);
            if (globalAdjustment.isPercentage) {
              onAmountChange(Math.min(100, num));
            } else {
              onAmountChange(num);
            }
          }}
          placeholder="0"
          className="flex-1 min-w-0 bg-transparent px-1 text-xs sm:text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300 tabular-nums"
        />

        {/* Unit Selector: [%] vs [đ] */}
        <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-md p-0.5 shrink-0">
          <button
            type="button"
            title="Tính theo phần trăm (%)"
            onClick={() => {
              if (!globalAdjustment.isPercentage) onTogglePercentage();
            }}
            className={cn(
              "px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer",
              globalAdjustment.isPercentage
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            %
          </button>
          <button
            type="button"
            title="Tính theo số tiền VNĐ (đ)"
            onClick={() => {
              if (globalAdjustment.isPercentage) onTogglePercentage();
            }}
            className={cn(
              "px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer",
              !globalAdjustment.isPercentage
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            đ
          </button>
        </div>
      </div>
    </div>
  );
}
