import { useMemo, useState } from 'react';
import { Package, Check, Minus, Plus, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Item } from './types';
import { groupItemsByKind } from './groupItemsByKind';

interface ItemCompensationProps {
  items: Item[];
  selectedQuantities: Record<string, number>;
  onChangeQuantity: (id: string, quantity: number) => void;
  formatCurrency: (amount: number) => string;
}

export function ItemCompensation({
  items,
  selectedQuantities,
  onChangeQuantity,
  formatCurrency,
}: ItemCompensationProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const totalCompensation = useMemo(() => {
    let total = 0;
    items.forEach((item) => {
      const qty = selectedQuantities[item.id] || 0;
      if (qty > 0) {
        total += item.unit_price * qty;
      }
    });
    return total;
  }, [items, selectedQuantities]);

  const selectedCount = useMemo(() => {
    return Object.values(selectedQuantities).filter((q) => q > 0).length;
  }, [selectedQuantities]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.item_name.toLowerCase().includes(q) ||
        (item.kind && item.kind.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const groupedItems = useMemo(() => groupItemsByKind(filteredItems), [filteredItems]);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header - Total Compensation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-medium text-slate-500">Tổng tiền bồi thường</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mt-0.5">
            {formatCurrency(totalCompensation)}
          </div>
        </div>
        <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold tabular-nums">
          {selectedCount} vật dụng đã chọn
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên vật dụng hoặc danh mục..."
            className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-colors placeholder:text-slate-400"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium tabular-nums shrink-0">
          {filteredItems.length} món
        </span>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Package size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs text-slate-400 font-medium">
            {searchQuery ? 'Không tìm thấy vật dụng phù hợp với tìm kiếm' : 'Chưa có danh sách vật dụng'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedItems.map(([kind, kindItems]) => (
            <div key={kind} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-700">
                  {kind}
                </h3>
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[11px] text-slate-400 font-medium tabular-nums">{kindItems.length}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {kindItems.map((item) => {
                  const qty = selectedQuantities[item.id] || 0;
                  const isSelected = qty > 0;
                  const itemTotal = item.unit_price * qty;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          onChangeQuantity(item.id, 0);
                        } else {
                          onChangeQuantity(item.id, 1);
                        }
                      }}
                      className={cn(
                        "relative flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      {/* Checkbox and Unit Price */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={cn(
                            "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                            isSelected ? "bg-white border-white text-slate-900" : "border-slate-300 bg-white"
                          )}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className={cn("text-[11px] tabular-nums font-semibold", isSelected ? "text-slate-300" : "text-slate-500")}>
                          {formatCurrency(item.unit_price)}
                        </span>
                      </div>

                      {/* Name */}
                      <div
                        className={cn(
                          "text-xs font-semibold leading-tight line-clamp-2 mb-2 flex-1",
                          isSelected ? "text-white" : "text-slate-900"
                        )}
                      >
                        {item.item_name}
                      </div>

                      {/* Quantity Stepper */}
                      {isSelected ? (
                        <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-slate-700/80">
                          <div className="flex items-center border border-slate-700 rounded bg-slate-800 text-white overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (qty > 1) onChangeQuantity(item.id, qty - 1);
                              }}
                              className={cn(
                                "w-5 h-5 flex items-center justify-center transition-colors",
                                qty > 1 ? "hover:bg-slate-700 text-white" : "text-slate-500 cursor-not-allowed"
                              )}
                              disabled={qty <= 1}
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-5 h-5 flex items-center justify-center text-[11px] font-bold tabular-nums">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (qty < item.quantity) onChangeQuantity(item.id, qty + 1);
                              }}
                              className={cn(
                                "w-5 h-5 flex items-center justify-center transition-colors",
                                qty < item.quantity ? "hover:bg-slate-700 text-white" : "text-slate-500 cursor-not-allowed"
                              )}
                              disabled={qty >= item.quantity}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                          <span className="text-[11px] font-bold text-white tabular-nums">
                            {formatCurrency(itemTotal)}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-auto pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                          Tối đa: {item.quantity}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
