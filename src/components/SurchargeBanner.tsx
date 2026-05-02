import React, { useMemo } from 'react';
import { DateAdjustment } from '../types';
import { AlertCircle } from 'lucide-react';

interface SurchargeBannerProps {
  adjustments: DateAdjustment[];
}

export const SurchargeBanner: React.FC<SurchargeBannerProps> = ({ adjustments }) => {
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
    <div className="bg-white border border-amber-200 shadow-sm rounded-3xl px-6 py-4 mb-8">
      <div className="flex items-start gap-3">
        <AlertCircle className="shrink-0 mt-0.5 text-amber-500" size={20} />
        <div className="flex-1">
          <p className="font-bold text-amber-900 mb-2">Thông báo phụ thu các ngày đặc biệt:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            {filteredAdjustments.map((adj) => (
              <li key={adj.id} className="flex items-center justify-between gap-x-2 text-sm">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-xs whitespace-nowrap shrink-0">
                    {new Date(adj.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <span className="text-amber-900 truncate">{adj.note || 'Phụ thu'}</span>
                </div>
                <span className="text-amber-700 font-bold whitespace-nowrap shrink-0">
                  +{(adj.amount || 0).toLocaleString()}{adj.isPercentage ? '%' : ' VNĐ'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
