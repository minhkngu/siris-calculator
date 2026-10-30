import React, { useMemo, useState } from 'react';
import { DateAdjustment } from '../types';
import { AlertCircle, ChevronDown, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

interface SurchargeBannerProps {
  adjustments: DateAdjustment[];
}

export const SurchargeBanner: React.FC<SurchargeBannerProps> = ({ adjustments }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(adj => {
      if (adj.type !== 'surcharge') return false;
      const adjDate = new Date(adj.date);
      adjDate.setHours(0, 0, 0, 0);
      return adjDate >= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [adjustments, today]);

  if (filteredAdjustments.length === 0) return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
            <AlertCircle size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-amber-950">
                Phụ thu các ngày đặc biệt sắp tới
              </span>
              <span className="text-[11px] font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                {filteredAdjustments.length} đợt
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-800/80 truncate hidden sm:block">
              Hệ thống tự động tính phụ thu khi ngày lưu trú trùng với các mốc bên dưới.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-100/70 hover:bg-amber-200/70 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
          <ChevronDown size={14} className={cn('transition-transform', isExpanded && 'rotate-180')} />
        </button>
      </div>

      {/* Quick horizontal preview on desktop when collapsed */}
      {!isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs">
          {filteredAdjustments.slice(0, 3).map((adj) => (
            <div
              key={adj.id}
              className="inline-flex items-center gap-1.5 bg-white/80 border border-amber-200/70 px-2.5 py-1 rounded-md shrink-0 text-amber-900"
            >
              <Calendar size={12} className="text-amber-700" />
              <span className="font-semibold tabular-nums">
                {new Date(adj.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              </span>
              <span className="text-amber-800/80 truncate max-w-[120px]">{adj.note || 'Phụ thu'}</span>
              <span className="font-bold text-amber-800 ml-0.5 tabular-nums">
                +{(adj.amount || 0).toLocaleString()}{adj.isPercentage ? '%' : ' VND'}
              </span>
            </div>
          ))}
          {filteredAdjustments.length > 3 && (
            <span className="text-[11px] font-medium text-amber-800 shrink-0">
              +{filteredAdjustments.length - 3} ngày nữa
            </span>
          )}
        </div>
      )}

      {/* Expanded list view */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/60">
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredAdjustments.map((adj) => (
              <li
                key={adj.id}
                className="flex items-center justify-between gap-2 bg-white/90 border border-amber-200/80 px-3 py-2 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded text-[11px] shrink-0 tabular-nums">
                    {new Date(adj.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <span className="text-amber-950 font-medium truncate">{adj.note || 'Phụ thu'}</span>
                </div>
                <span className="text-amber-800 font-bold shrink-0 tabular-nums">
                  +{(adj.amount || 0).toLocaleString()}{adj.isPercentage ? '%' : ' VND'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
