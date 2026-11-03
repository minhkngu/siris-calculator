import { Plus, Minus, Check } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { AnimatedPanel } from './AnimatedPanel';
import { cn } from '../lib/utils';
import { GlobalAdjustment } from '../components/types';
import { memo } from 'react';

interface GlobalAdjustmentControlProps {
  globalAdjustment: GlobalAdjustment;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onCloseDropdown: () => void;
  onTypeChange: (type: 'surcharge' | 'discount') => void;
  onAmountChange: (amount: number) => void;
  onTogglePercentage: () => void;
}

function GlobalAdjustmentControlBase({
  globalAdjustment,
  showDropdown,
  onToggleDropdown,
  onCloseDropdown,
  onTypeChange,
  onAmountChange,
  onTogglePercentage,
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
      <div className="w-full h-12 px-2 bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-2 transition-colors focus-within:bg-white focus-within:border-brand-700 focus-within:ring-1 focus-within:ring-brand-700">
        {/* Type Selector Dropdown Trigger */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onToggleDropdown}
            aria-expanded={showDropdown}
            aria-label={`Loại điều chỉnh: ${isSurcharge ? 'Phụ thu' : 'Giảm giá'}`}
            className={cn(
              "h-8 px-3 rounded-md border border-slate-700 bg-slate-800 text-xs font-bold uppercase tracking-wide text-white hover:bg-slate-700 transition-colors shrink-0 cursor-pointer flex items-center",
              showDropdown && "bg-slate-700"
            )}
          >
            <span>{isSurcharge ? 'Phụ thu' : 'Giảm giá'}</span>
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
                  className="absolute top-full left-0 mt-1.5 w-40 bg-white shadow-lg rounded-lg border border-slate-200 p-1 z-50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onTypeChange('surcharge');
                      onCloseDropdown();
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer",
                      isSurcharge ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 text-slate-500 flex items-center justify-center shrink-0">
                        <Plus size={12} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-semibold">Phụ thu</div>
                      </div>
                    </div>
                    {isSurcharge && <Check size={14} className="text-slate-700 shrink-0" strokeWidth={2.5} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTypeChange('discount');
                      onCloseDropdown();
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer mt-0.5",
                      !isSurcharge ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 text-slate-500 flex items-center justify-center shrink-0">
                        <Minus size={12} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-semibold">Giảm giá</div>
                      </div>
                    </div>
                    {!isSurcharge && <Check size={14} className="text-slate-700 shrink-0" strokeWidth={2.5} />}
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
              "w-12 h-8 rounded text-sm font-bold transition-colors cursor-pointer",
              globalAdjustment.isPercentage
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            %
          </button>
          <button
            type="button"
            title="Tính theo số tiền VND"
            onClick={() => {
              if (globalAdjustment.isPercentage) onTogglePercentage();
            }}
            className={cn(
              "w-12 h-8 rounded text-sm font-bold transition-colors cursor-pointer",
              !globalAdjustment.isPercentage
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            VND
          </button>
        </div>
      </div>
    </div>
  );
}

export const GlobalAdjustmentControl = memo(GlobalAdjustmentControlBase);
