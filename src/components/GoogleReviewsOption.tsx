import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface GoogleReviewsOptionProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function GoogleReviewsOption({ checked, onChange }: GoogleReviewsOptionProps) {
    return (
        <label className={cn('group flex items-center justify-between gap-2 p-3.5 border rounded-xl cursor-pointer transition-all duration-200', checked ? 'border-blue-500 bg-blue-50/40 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-sm')}>
            <span className="flex items-center min-w-0">
                <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="sr-only peer" />
                <span className={cn('w-5 h-5 rounded-[6px] border flex items-center justify-center mr-3.5 shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500', checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover:border-blue-400')}>
                    <Check className={cn('w-3.5 h-3.5 text-white', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} />
                </span>
                <span className={cn('text-[15px]', checked ? 'text-slate-900 font-medium' : 'text-slate-700')}>Google Reviews</span>
            </span>
            <span className={cn('px-2 py-1 rounded-md text-[12px] sm:text-[13px] font-semibold shrink-0', checked ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}>−10% · tối đa 70.000đ</span>
        </label>
    );
}
