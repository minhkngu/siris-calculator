import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export function DescriptionInfo({ description, name }: { description: string; name: string }) {
  const [position, setPosition] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!position) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) setPosition(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPosition(null); trigger.current?.focus(); }
    };
    const closeOnScroll = (event: Event) => {
      if (panel.current?.contains(event.target as Node)) return;
      setPosition(null);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnScroll);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnScroll);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [position]);

  const toggle = () => {
    if (position) { setPosition(null); return; }
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(280, window.innerWidth - 24);
    const above = window.innerHeight - rect.bottom < 170 && rect.top > 170;
    setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), top: above ? rect.top - 8 : rect.bottom + 8, above });
  };

  return <>
    <button ref={trigger} type="button" aria-label={`Xem mô tả ${name}`} aria-expanded={!!position} aria-controls={id} onClick={event => { event.preventDefault(); event.stopPropagation(); toggle(); }} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"><Info size={15} strokeWidth={1.8} /></button>
    {position && createPortal(<div ref={panel} id={id} role="note" onClick={event => event.stopPropagation()} style={{ left: position.left, top: position.top, transform: position.above ? 'translateY(-100%)' : undefined }} className="fixed z-[100] w-[280px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 text-left text-emerald-950 shadow-xl">
      <p className="max-h-48 overflow-y-auto whitespace-pre-line px-3.5 py-3 text-xs leading-relaxed">{description}</p>
    </div>, document.body)}
  </>;
}
