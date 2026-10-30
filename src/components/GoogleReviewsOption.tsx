import { Check, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface GoogleReviewsOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function GoogleReviewsOption({ checked, onChange }: GoogleReviewsOptionProps) {
  return (
    <label
      className={cn(
        "group flex items-center justify-between gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none",
        checked
          ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={cn(
            "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors",
            checked
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-slate-300 bg-white group-hover:border-slate-400"
          )}
        >
          {checked && <Check size={11} strokeWidth={3} />}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Star size={14} className={cn(checked ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
          <span className={cn("text-xs font-semibold truncate", checked ? "text-emerald-950" : "text-slate-900")}>
            Ưu đãi đánh giá Google Maps
          </span>
        </div>
      </div>

      <div className="shrink-0">
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded tabular-nums",
            checked
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
          )}
        >
          −10% (tối đa 70.000 VND)
        </span>
      </div>
    </label>
  );
}
