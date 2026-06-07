import { Filter, Hotel, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { ComparisonItem, Branch, RoomType } from './types';

interface ComparisonPanelProps {
    comparisons: ComparisonItem[];
    branches: Branch[];
    roomTypes: RoomType[];
    compareBranchIds: string[];
    compareRoomIds: string[];
    showCompareFilter: boolean;
    filterTab: 'branch' | 'room';
    selectedRoomId: string;
    onToggleFilter: () => void;
    onCloseFilter: () => void;
    onSetFilterTab: (tab: 'branch' | 'room') => void;
    onToggleBranchFilter: (branchId: string) => void;
    onToggleRoomFilter: (roomId: string) => void;
    onSelectAll: (tab: 'branch' | 'room') => void;
    onDeselectAll: (tab: 'branch' | 'room') => void;
    formatCurrency: (amount: number) => string;
}

const BRANCH_COLORS = [
    'text-indigo-600',
    'text-emerald-600',
    'text-amber-600',
    'text-rose-600',
    'text-violet-600',
    'text-cyan-600',
];

export function ComparisonPanel({
    comparisons,
    branches,
    roomTypes,
    compareBranchIds,
    compareRoomIds,
    showCompareFilter,
    filterTab,
    selectedRoomId,
    onToggleFilter,
    onCloseFilter,
    onSetFilterTab,
    onToggleBranchFilter,
    onToggleRoomFilter,
    onSelectAll,
    onDeselectAll,
    formatCurrency,
}: ComparisonPanelProps) {
    return (
        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-slate-800">So sánh lựa chọn</h3>
                </div>

                <div className="relative">
                    <button
                        onClick={onToggleFilter}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                            compareBranchIds.length < branches.length
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                    >
                        <Filter size={13} />
                        Lọc
                        {compareBranchIds.length < branches.length && (
                            <span className="bg-white text-blue-600 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ml-0.5">
                                {compareBranchIds.length}
                            </span>
                        )}
                    </button>

                    {showCompareFilter && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={onCloseFilter} />
                            <div className="absolute top-full right-0 mt-2 w-64 z-50 bg-white shadow-xl rounded-xl border border-slate-200 p-2 origin-top-right">
                                <div className="flex p-1 bg-slate-100 rounded-lg mb-2">
                                    <button
                                        onClick={() => onSetFilterTab('branch')}
                                        className={cn(
                                            "flex-1 py-1 text-[11px] font-semibold rounded-md transition-all",
                                            filterTab === 'branch' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Cơ sở
                                    </button>
                                    <button
                                        onClick={() => onSetFilterTab('room')}
                                        className={cn(
                                            "flex-1 py-1 text-[11px] font-semibold rounded-md transition-all",
                                            filterTab === 'room' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Loại phòng
                                    </button>
                                </div>

                                <div className="p-1 border-b border-slate-100 mb-1">
                                    <button
                                        onClick={() => {
                                            const allSelected = filterTab === 'branch'
                                                ? compareBranchIds.length === branches.length
                                                : compareRoomIds.length === roomTypes.length;
                                            if (allSelected) {
                                                onDeselectAll(filterTab);
                                            } else {
                                                onSelectAll(filterTab);
                                            }
                                        }}
                                        className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border w-full bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                                    >
                                        {(
                                            filterTab === 'branch'
                                                ? compareBranchIds.length === branches.length
                                                : compareRoomIds.length === roomTypes.length
                                        ) ? (
                                            <>
                                                <Check size={10} className="text-blue-600" />
                                                <span className="text-blue-600">Đã chọn tất cả</span>
                                            </>
                                        ) : (
                                            <span>Chọn tất cả</span>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-0.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                                    {filterTab === 'branch' ? (
                                        branches.map(branch => (
                                            <button
                                                key={branch.id}
                                                onClick={() => onToggleBranchFilter(branch.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-all",
                                                    compareBranchIds.includes(branch.id)
                                                        ? "bg-blue-50 text-blue-700 font-semibold"
                                                        : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <span>{branch.name}</span>
                                                {compareBranchIds.includes(branch.id) && <Check size={11} />}
                                            </button>
                                        ))
                                    ) : (
                                        roomTypes.map(room => {
                                            const branch = branches.find(b => b.id === room.branchId);
                                            return (
                                                <button
                                                    key={room.id}
                                                    onClick={() => onToggleRoomFilter(room.id)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-all",
                                                        compareRoomIds.includes(room.id)
                                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                                            : "text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>{room.name}</span>
                                                        <span className="text-[10px] text-slate-400">{branch?.name}</span>
                                                    </div>
                                                    {compareRoomIds.includes(room.id) && <Check size={11} />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* List - 2 column grid */}
            <div>
                {comparisons.length === 0 ? (
                    <div className="py-10 text-center">
                        <Hotel size={36} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[13px] text-slate-400">Không có lựa chọn nào phù hợp</p>
                        <button
                            onClick={() => onSelectAll('branch')}
                            className="mt-3 text-[11px] font-semibold text-blue-600 hover:underline"
                        >
                            Khôi phục bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-1 sm:gap-2 p-1.5 sm:p-3">
                        {comparisons.map(({ room, branch, calculation: roomCalc, diff }, idx) => {
                            const branchIdx = branches.findIndex(b => b.id === room.branchId);
                            const branchColor = BRANCH_COLORS[branchIdx % BRANCH_COLORS.length];
                            const isSelected = selectedRoomId === room.id;

                            return (
                                <div
                                    key={room.id}
                                    className={cn(
                                        "rounded-lg sm:rounded-xl border transition-all p-1.5 sm:p-2",
                                        isSelected
                                            ? "bg-blue-50/80 border-blue-200 shadow-sm shadow-blue-100"
                                            : "bg-white border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-[11px] sm:text-[12px] truncate",
                                            isSelected ? "font-semibold text-slate-900" : "text-slate-700"
                                        )}>
                                            {room.name}
                                        </span>
                                        <span className={cn(
                                            "text-[9px] sm:text-[10px] font-medium truncate ml-1",
                                            branchColor
                                        )}>
                                            {branch?.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <div className={cn(
                                            "text-[11px] sm:text-[13px] font-bold",
                                            isSelected ? "text-blue-700" : "text-slate-800"
                                        )}>
                                            {roomCalc ? formatCurrency(roomCalc.finalTotal) : '---'}
                                        </div>
                                        {diff !== 0 && (
                                            <div className={cn(
                                                "text-[10px] sm:text-[11px] font-bold ml-1",
                                                diff > 0 ? "text-rose-500" : "text-emerald-500"
                                            )}>
                                                {diff > 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}