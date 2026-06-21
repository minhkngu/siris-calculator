import { useMemo, useState } from 'react';
import { Package, Check, Minus, Plus, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Item } from './types';

interface ItemCompensationProps {
    items: Item[];
    selectedQuantities: Record<number, number>;
    onChangeQuantity: (id: number, quantity: number) => void;
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
        items.forEach(item => {
            const qty = selectedQuantities[item.id] || 0;
            if (qty > 0) {
                total += item.unit_price * qty;
            }
        });
        return total;
    }, [items, selectedQuantities]);

    const selectedCount = useMemo(() => {
        return Object.values(selectedQuantities).filter(q => q > 0).length;
    }, [selectedQuantities]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.trim().toLowerCase();
        return items.filter(item =>
            item.item_name.toLowerCase().includes(q) ||
            (item.kind && item.kind.toLowerCase().includes(q))
        );
    }, [items, searchQuery]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, Item[]> = {};
        filteredItems.forEach(item => {
            const key = item.kind || 'Khác';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }, [filteredItems]);

    return (
        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 sm:p-6 transition-all">
            {/* Header - Total */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div>
                    <div className="text-[11px] sm:text-[13px] font-semibold text-slate-500 mb-0.5 sm:mb-1">Tổng tiền bồi thường</div>
                    <div className="text-[22px] sm:text-[28px] font-bold text-slate-900 tracking-tight">
                        {formatCurrency(totalCompensation)}
                    </div>
                </div>
                <div className="bg-rose-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold text-rose-600 border border-rose-100">
                    {selectedCount} vật dụng
                </div>
            </div>

            <div className="w-full h-px bg-slate-100 mb-4 sm:mb-5"></div>

            {/* Search + total items count */}
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm vật dụng..."
                        className="w-full h-9 sm:h-10 pl-9 pr-3 text-[13px] sm:text-[14px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="text-[12px] sm:text-[13px] text-slate-400 font-medium whitespace-nowrap">
                    {filteredItems.length} món
                </div>
            </div>

            <div className="w-full h-px bg-slate-100 mb-4 sm:mb-5"></div>

            {filteredItems.length === 0 ? (
                <div className="text-center py-8 sm:py-10">
                    <Package size={32} className="mx-auto text-slate-200 mb-2 sm:mb-3" />
                    <p className="text-[14px] sm:text-[15px] text-slate-400 font-medium">
                        {searchQuery ? 'Không tìm thấy vật dụng phù hợp' : 'Không có vật dụng nào'}
                    </p>
                </div>
            ) : (
                <div>
                    {Object.entries(groupedItems).map(([kind, kindItems]) => (
                        <div key={kind} className="mb-4 sm:mb-6">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3 px-1">
                                <h3 className="text-[12px] sm:text-[13px] font-semibold text-slate-400 uppercase tracking-wider">
                                    {kind}
                                </h3>
                                <span className="h-px flex-1 bg-slate-100"></span>
                                <span className="text-[11px] sm:text-[12px] text-slate-300 font-medium">{kindItems.length}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-2.5">
                                {kindItems.map(item => {
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
                                                "relative flex flex-col p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none",
                                                isSelected
                                                    ? "bg-rose-50 border-rose-200 shadow-sm"
                                                    : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                                            )}
                                        >
                                            {/* Checkbox */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={cn(
                                                    "w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-[5px] border flex items-center justify-center transition-colors duration-200",
                                                    isSelected
                                                        ? 'bg-rose-600 border-rose-600'
                                                        : 'border-slate-300'
                                                )}>
                                                    <Check className={cn(
                                                        "w-2.5 h-2.5 sm:w-3 sm:h-3 text-white transition-transform duration-200",
                                                        isSelected ? 'scale-100' : 'scale-0'
                                                    )} strokeWidth={3} />
                                                </div>
                                                <span className="text-[11px] sm:text-[12px] text-slate-400">
                                                    {formatCurrency(item.unit_price)}
                                                </span>
                                            </div>

                                            {/* Name */}
                                            <div className={cn(
                                                "text-[12px] sm:text-[13px] font-medium leading-tight mb-2",
                                                isSelected ? "text-slate-900" : "text-slate-700"
                                            )}>
                                                {item.item_name}
                                            </div>

                                            {/* Quantity controls (only visible when selected) */}
                                            {isSelected ? (
                                                <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-rose-100">
                                                    <div className="flex items-center border border-rose-200 rounded-lg overflow-hidden bg-white">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (qty > 1) onChangeQuantity(item.id, qty - 1);
                                                            }}
                                                            className={cn(
                                                                "w-6 h-6 flex items-center justify-center transition-colors",
                                                                qty > 1
                                                                    ? "text-rose-600 hover:bg-rose-50"
                                                                    : "text-slate-300 cursor-not-allowed"
                                                            )}
                                                            disabled={qty <= 1}
                                                        >
                                                            <Minus size={11} />
                                                        </button>
                                                        <span className="w-6 h-6 flex items-center justify-center text-[11px] font-bold text-rose-600 border-x border-rose-200">
                                                            {qty}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (qty < item.quantity) onChangeQuantity(item.id, qty + 1);
                                                            }}
                                                            className={cn(
                                                                "w-6 h-6 flex items-center justify-center transition-colors",
                                                                qty < item.quantity
                                                                    ? "text-rose-600 hover:bg-rose-50"
                                                                    : "text-slate-300 cursor-not-allowed"
                                                            )}
                                                            disabled={qty >= item.quantity}
                                                        >
                                                            <Plus size={11} />
                                                        </button>
                                                    </div>
                                                    <span className="text-[12px] font-bold text-rose-600">{formatCurrency(itemTotal)}</span>
                                                </div>
                                            ) : (
                                                <div className="mt-auto pt-1.5 border-t border-slate-100 text-[11px] text-slate-300">
                                                    × {item.quantity} {item.kind || ''}
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