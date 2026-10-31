import React from 'react';
import { Accommodation, Room } from '../types';
import { TRANSLATIONS } from '../constants';
import { BedDouble, Check, X, Building2, AlertTriangle, Home } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface FlyerProps {
  accommodation: Accommodation;
  room: Room;
  id?: string;
  variant?: 'full' | 'monthly';
}

export const Flyer: React.FC<FlyerProps> = ({ accommodation, room, id, variant = 'full' }) => {
  const vi = TRANSLATIONS.vi;
  const en = TRANSLATIONS.en;
  const branchAmenities = variant === 'monthly' ? accommodation.longTermAmenities : accommodation.amenities;
  const roomAmenities = variant === 'monthly' ? room.longTermAmenities : room.amenities;

  const renderBilingualLabel = (viText: string, enText: string, className?: string) => (
    <div className={className}>
      <div className="text-[11px] font-black uppercase tracking-wider leading-none">{viText}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 leading-none mt-0.5">{enText}</div>
    </div>
  );

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getPriceAmount = (value: string) => {
    if (value.includes('N/A')) return 'N/A';
    return value.split('/')[0].replace(/\s*VND\s*$/i, '').trim();
  };

  const renderAmenityItem = (item: string, isExcluded: boolean) => {
    return (
      <div className={cn(
        'inline-flex items-center gap-1 py-1 px-2 rounded-full border text-[10px] leading-tight font-bold',
        isExcluded
          ? 'bg-rose-50 border-rose-200 text-rose-900 border-dashed'
          : 'bg-emerald-50 border-emerald-100 text-emerald-900'
      )}>
        {isExcluded ? (
          <X className="w-2.5 h-2.5 text-rose-500 shrink-0" />
        ) : (
          <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
        )}
        <span>
          {capitalizeFirstLetter(item)}
        </span>
      </div>
    );
  };

  const renderAmenityGrid = (label: string, items: string[], isExcluded: boolean) => (
    <div className="flex flex-col gap-1">
      <h3 className="text-[9px] font-black uppercase text-neutral-600 border-b border-neutral-200 pb-0.5">{label}</h3>
      <div className="flex flex-wrap gap-1">
        {items.map((item, idx) => (
          <div key={`${isExcluded ? 'exc' : 'inc'}-${idx}`}>{renderAmenityItem(item, isExcluded)}</div>
        ))}
      </div>
    </div>
  );

  const renderImageGrid = () => {
    const images = room.imageUrls.slice(0, 6);
    const count = images.length;

    if (count === 0) {
      return (
        <div className="h-[520px] bg-neutral-100 flex items-center justify-center">
          <BedDouble className="w-16 h-16 text-neutral-200" />
        </div>
      );
    }

    // Single image: full width
    if (count === 1) {
      return (
        <div className="h-[520px] bg-neutral-200 relative overflow-hidden">
          <img
            src={images[0]}
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <img
            src={images[0]}
            className="relative w-full h-full object-cover"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>
      );
    }

    // 2 images: side by side, equal width
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 h-[520px] bg-neutral-200">
          {images.map((url, i) => (
            <div key={i} className="overflow-hidden">
              <img
                src={url}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      );
    }

    // 3 images: one large left, two stacked right
    if (count === 3) {
      return (
        <div className="grid grid-cols-3 gap-0.5 h-[520px] bg-neutral-200">
          <div className="col-span-2 overflow-hidden">
            <img
              src={images[0]}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
          <div className="grid grid-rows-2 gap-0.5">
            {[images[1], images[2]].map((url, i) => (
              <div key={i} className="overflow-hidden">
                <img
                  src={url}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4 images: 2x2 grid
    if (count === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-[520px] bg-neutral-200">
          {images.map((url, i) => (
            <div key={i} className="overflow-hidden">
              <img
                src={url}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      );
    }

    // 5 images: 2 on top row (3 cols each), 3 on bottom (2 cols each)
    if (count === 5) {
      return (
        <div className="grid grid-cols-6 grid-rows-2 gap-0.5 h-[520px] bg-neutral-200">
          {images.slice(0, 2).map((url, i) => (
            <div key={i} className="col-span-3 row-span-1 overflow-hidden">
              <img src={url} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" loading="lazy" />
            </div>
          ))}
          {images.slice(2).map((url, i) => (
            <div key={i + 2} className="col-span-2 row-span-1 overflow-hidden">
              <img src={url} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" loading="lazy" />
            </div>
          ))}
        </div>
      );
    }

    // 6+ images: 3x2 grid
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-0.5 bg-neutral-200 h-[520px]">
        {images.map((url, idx) => (
          <div key={idx} className="overflow-hidden">
            <img
              src={url}
              alt={`${room.name} ${idx + 1}`}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderPolicies = (policies: any) => {
    if (!policies) return null;

    // Try to parse if stringified JSON
    let data = policies;
    if (typeof policies === 'string') {
      try { data = JSON.parse(policies); } catch { data = policies; }
    }

    // Helper to recursively extract strings from any JSON structure
    const extractStrings = (obj: any): string[] => {
      if (typeof obj === 'string') return [obj];
      if (Array.isArray(obj)) return obj.flatMap(extractStrings);
      if (typeof obj === 'object' && obj !== null) {
        // Prioritize 'content' key if it exists
        if ('content' in obj) {
          return extractStrings(obj.content);
        }
        return Object.values(obj).flatMap(extractStrings);
      }
      return [];
    };

    const strings = extractStrings(data).filter(s => s.trim().length > 0);
    if (strings.length === 0) return null;

    // Join all extracted text
    const contentStr = strings.join('\n');

    // Clean up excessive newlines to keep the block compact
    const cleanContent = contentStr.replace(/\n{2,}/g, '\n').trim();

    if (!cleanContent) return null;

    return (
      <div className="text-[9px] font-medium text-neutral-600 leading-[1.3] break-words whitespace-pre-line mt-1">
        {cleanContent}
      </div>
    );
  };

  return (
    <div
      id={id}
      className="w-[900px] min-h-[1000px] h-auto bg-white shadow-2xl font-sans text-neutral-900"
      style={{ minWidth: '900px' }}
    >
      {/* Image Section - Dynamic Grid */}
      <div className="shrink-0">
        {renderImageGrid()}
      </div>

      {/* Content Area - Modern Editorial Style */}
      <div className="p-5 flex flex-col bg-white">
        {/* Header Section - Compact & Modern */}
        <div className="mb-3 pb-3 border-b border-neutral-100">
          <div className="flex justify-between items-start mb-1">
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-indigo-600 mb-0.5">
                <Building2 className="w-2.5 h-2.5 shrink-0" />
                <p className="text-[9px] font-black tracking-[0.1em] uppercase truncate">
                  {accommodation.name} • {accommodation.address}
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                      {room.name}
                    </h1>
                    <span className="text-neutral-400 font-bold text-xl">/</span>
                    <h2 className="text-xl font-bold tracking-tight text-neutral-600">
                      {room.nameEn}
                    </h2>
                    <div className="flex items-center justify-center bg-yellow-400 px-2 py-0.5 rounded shadow-sm border border-yellow-500/20 shrink-0 ml-1 self-center">
                      <span className="text-[10px] font-black text-yellow-950 uppercase tracking-tight leading-none">
                        {room.area.split('/')[0].trim()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Amenities Section */}
        {branchAmenities && (
          <div className="mb-3 pb-3 border-b border-neutral-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="w-3 h-3 text-indigo-600" />
                  <h3 className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">{vi.amenitiesLabel} cơ sở</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  {branchAmenities.includedVi.map((item, idx) => (
                    <div key={`branch-inc-${idx}`}>{renderAmenityItem(item, false)}</div>
                  ))}
                </div>
                {branchAmenities.excludedVi.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {branchAmenities.excludedVi.map((item, idx) => (
                      <div key={`branch-exc-${idx}`}>{renderAmenityItem(item, true)}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-[9px] font-black uppercase text-indigo-600 tracking-wider mb-1">Branch amenities</h3>
                <div className="flex flex-wrap gap-1">
                  {branchAmenities.includedEn.map((item, idx) => (
                    <div key={`branch-inc-en-${idx}`}>{renderAmenityItem(item, false)}</div>
                  ))}
                </div>
                {branchAmenities.excludedEn.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {branchAmenities.excludedEn.map((item, idx) => (
                      <div key={`branch-exc-en-${idx}`}>{renderAmenityItem(item, true)}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Branch Policies Section */}
        {(accommodation.policies || accommodation.policiesEn) && (
          <div className="mb-3 pb-3 border-b border-neutral-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                <h3 className="text-[9px] font-black uppercase text-purple-700 mb-1">Chú thích</h3>
                {renderPolicies(accommodation.policies)}
              </div>
              <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                <h3 className="text-[9px] font-black uppercase text-purple-700 mb-1">Note</h3>
                {renderPolicies(accommodation.policiesEn || accommodation.policies)}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Row */}
        <div className="mb-3">
          {variant === 'full' ? (
            <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-sm">
              <div className="px-3 text-center">
                <div className="mb-2 whitespace-nowrap text-[11px] font-black uppercase tracking-wide text-slate-500">
                  {vi.priceSunThu} <span className="text-[8px] font-bold text-slate-400">({en.priceSunThu})</span>
                </div>
                <div className="flex items-baseline justify-center gap-1.5 whitespace-nowrap">
                  <span className="text-[24px] font-black leading-none tracking-tight text-slate-900 tabular-nums">{getPriceAmount(room.priceSunThu)}</span>
                  {getPriceAmount(room.priceSunThu) !== 'N/A' && <span className="text-[9px] font-bold text-slate-500">VND <span className="font-medium text-slate-400">/đêm</span></span>}
                </div>
              </div>
              <div className="px-3 text-center">
                <div className="mb-2 whitespace-nowrap text-[11px] font-black uppercase tracking-wide text-amber-600">
                  {vi.priceFriSat} <span className="text-[8px] font-bold text-amber-500">({en.priceFriSat})</span>
                </div>
                <div className="flex items-baseline justify-center gap-1.5 whitespace-nowrap">
                  <span className="text-[24px] font-black leading-none tracking-tight text-slate-900 tabular-nums">{getPriceAmount(room.priceFriSat)}</span>
                  {getPriceAmount(room.priceFriSat) !== 'N/A' && <span className="text-[9px] font-bold text-slate-500">VND <span className="font-medium text-slate-400">/đêm</span></span>}
                </div>
              </div>
              <div className="px-3 text-center">
                <div className="mb-2 whitespace-nowrap text-[11px] font-black uppercase tracking-wide text-emerald-600">
                  Giá tháng <span className="text-[8px] font-bold text-emerald-500">(Monthly)</span>
                </div>
                <div className="flex items-baseline justify-center gap-1.5 whitespace-nowrap">
                  <span className="text-[24px] font-black leading-none tracking-tight text-slate-900 tabular-nums">{getPriceAmount(room.priceMonthUnder3)}</span>
                  {getPriceAmount(room.priceMonthUnder3) !== 'N/A' && <span className="text-[9px] font-bold text-slate-500">VND <span className="font-medium text-slate-400">/tháng</span></span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-center">
                {renderBilingualLabel(vi.priceMonthUnder3, en.priceMonthUnder3, 'mb-0.5')}
                <div className="text-base font-black text-blue-800">{room.priceMonthUnder3.includes('N/A') ? 'N/A' : room.priceMonthUnder3}</div>
                {room.priceMonthUnder3En !== 'N/A' && (
                  <div className="text-[7px] font-bold text-blue-700 opacity-70">{room.priceMonthUnder3En}</div>
                )}
              </div>
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-center">
                {renderBilingualLabel(vi.priceMonthOver3 + ' + ' + vi.feesLabel, en.priceMonthOver3 + ' + ' + en.feesLabel, 'mb-0.5')}
                <div className="text-base font-black text-blue-800">{room.priceMonthOver3.includes('N/A') ? 'N/A' : room.priceMonthOver3}</div>
                {room.priceMonthOver3En !== 'N/A' && (
                  <div className="text-[7px] font-bold text-blue-700 opacity-70">{room.priceMonthOver3En}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Warnings Section */}
        {(room.warningVi || room.warningEn) && (
          <div className="mb-3 grid grid-cols-2 gap-3">
            {room.warningVi && (
              <div className="p-2.5 bg-amber-50 rounded-xl border-l-4 border-amber-500 shadow-sm flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-[9px] font-black uppercase text-amber-950 tracking-wider">Lưu ý:</p>
                  <p className="text-[8px] font-medium text-neutral-800 whitespace-pre-line break-words">{room.warningVi}</p>
                </div>
              </div>
            )}
            {room.warningEn && (
              <div className="p-2.5 bg-amber-50 rounded-xl border-l-4 border-amber-500 shadow-sm flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-[9px] font-black uppercase text-amber-950 tracking-wider">Warning:</p>
                  <p className="text-[8px] font-medium text-neutral-800 whitespace-pre-line break-words">{room.warningEn}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Room Amenities Section */}
        {roomAmenities && (
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2 min-w-0">
              {renderAmenityGrid(vi.amenitiesLabel + ' phòng', roomAmenities.includedVi, false)}
              {roomAmenities.excludedVi.length > 0 && renderAmenityGrid('', roomAmenities.excludedVi, true)}
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              {renderAmenityGrid('Room amenities', roomAmenities.includedEn, false)}
              {roomAmenities.excludedEn.length > 0 && renderAmenityGrid('', roomAmenities.excludedEn, true)}
            </div>
          </div>
        )}

        {/* Fees Section */}
        {variant === 'monthly' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-violet-50 p-3 rounded-xl border border-violet-200 shadow-sm">
            <div className="flex flex-col gap-0.5 mb-2 border-b border-violet-200/60 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>
                <h3 className="text-[10px] font-black uppercase text-violet-900 tracking-wider">{vi.feesLabel}</h3>
              </div>
              <span className="text-[8px] font-bold text-violet-600 ml-3 uppercase tracking-wide">Áp dụng nếu thuê tháng (hợp đồng 3 tháng)</span>
            </div>
            <div className="space-y-1.5 ml-3">
              {room.feesVi.map((fee, index) => (
                <div key={index} className="text-[10px] font-bold text-violet-950 leading-snug flex items-start gap-1.5">
                  <span className="text-violet-500 mt-[1px] font-black">•</span>
                  <span>{fee}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-violet-50 p-3 rounded-xl border border-violet-200 shadow-sm">
            <div className="flex flex-col gap-0.5 mb-2 border-b border-violet-200/60 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>
                <h3 className="text-[10px] font-black uppercase text-violet-900 tracking-wider">{en.feesLabel}</h3>
              </div>
              <span className="text-[8px] font-bold text-violet-600 ml-3 uppercase tracking-wide">Applicable for monthly rental (3-month contract)</span>
            </div>
            <div className="space-y-1.5 ml-3">
              {room.feesEn.map((fee, index) => (
                <div key={index} className="text-[10px] font-bold text-violet-950 leading-snug flex items-start gap-1.5">
                  <span className="text-violet-500 mt-[1px] font-black">•</span>
                  <span>{fee}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Subtle Branding */}
        <div className="mt-4 pt-4 flex justify-center">
          <div className="h-px w-12 bg-neutral-300" />
        </div>
      </div>
    </div>
  );
};
