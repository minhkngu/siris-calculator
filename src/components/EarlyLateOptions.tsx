import { DescriptionInfo } from './DescriptionInfo';
import { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CalculationResult } from './types';
import { serviceAmount, serviceAvailable, type ServiceRule } from '../lib/serviceRules';

interface Props {
  selectedOptions: ReadonlySet<string>;
  onToggle: (code: string) => void;
  calculation: CalculationResult | null;
  serviceRules: ServiceRule[];
  formatCurrency: (amount: number) => string;
  checkIn: string;
  checkOut: string;
}

function EarlyLateOptionsBase({ selectedOptions, onToggle, calculation, serviceRules, formatCurrency, checkIn, checkOut }: Props) {
  const [expanded, setExpanded] = useState(true);
  const prices = { previousNight: calculation?.previousNightPrice ?? 0, nextNight: calculation?.nextNightPrice ?? 0, firstNight: calculation?.nights[0]?.finalPrice ?? 0, subtotal: calculation?.totalBase ?? 0 };
  const options = serviceRules.map(rule => ({ code: rule.code, name: rule.name, description: [rule.description, rule.timeFrom || rule.timeTo ? `${rule.timeFrom?.slice(0, 5) ?? '…'} – ${rule.timeTo?.slice(0, 5) ?? '…'}` : ''].filter(Boolean).join(' · '), disabled: !serviceAvailable(rule, checkIn, checkOut), amount: serviceAmount(rule, prices) }));
  return <section className="space-y-2.5">
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-xs font-semibold text-slate-800"><span>Dịch vụ thêm</span><ChevronDown size={14} className={expanded ? 'rotate-180' : ''} /></button>
    {expanded && <div className="grid auto-rows-fr grid-cols-1 gap-1.5">{options.map(option => <div key={option.code} onClick={!option.disabled ? () => onToggle(option.code) : undefined} className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${option.disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400' : selectedOptions.has(option.code) ? 'cursor-pointer border-brand-700 bg-brand-700 text-white' : 'cursor-pointer border-slate-200 bg-white text-slate-900'}`}>
      <span className="flex min-w-0 items-center gap-2"><input className="shrink-0" aria-label={option.name} onClick={event => event.stopPropagation()} type="checkbox" checked={selectedOptions.has(option.code) && !option.disabled} disabled={option.disabled} onChange={() => onToggle(option.code)} /><span className="min-w-0"><span className="flex items-center gap-1"><span className="font-semibold">{option.name}</span>{option.description && <DescriptionInfo description={option.description} name={option.name} />}</span>{option.disabled && <span className="block text-rose-500">Không áp dụng vào ngày đã chọn</span>}</span></span>
      <span className="shrink-0 text-right font-bold tabular-nums">{option.disabled ? '—' : `${option.amount < 0 ? '−' : '+'}${formatCurrency(Math.abs(option.amount))}`}</span>
    </div>)}</div>}
  </section>;
}
export const EarlyLateOptions = memo(EarlyLateOptionsBase);
