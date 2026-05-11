import { ArrowUpDown, Filter, Hotel, Check, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { ComparisonItem, Branch, RoomType } from './types';

const BRANCH_THEMES = [
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', shadow: 'shadow-indigo-100' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', shadow: 'shadow-emerald-100' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', shadow: 'shadow-amber-100' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', shadow: 'shadow-rose-100' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', shadow: 'shadow-violet-100' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', shadow: 'shadow-cyan-100' },
];

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
    onSelect: (branchId: string, roomId: string) => void;
    formatCurrency: (amount: number) => string;
}

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
    onSelect,
    formatCurrency,
}: ComparisonPanelProps) {
    return (
        <section className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                        <ArrowUpDown size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">So sánh các lựa chọn</h3>
                        <p className="text-[10px] text-zinc-500">Tìm phương án tối ưu nhất</p>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={onToggleFilter}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                            compareBranchIds.length < branches.length
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                : "bg-white border border-zinc-200 text-zinc-500 hover:border-indigo-600 hover:text-indigo-600"
                        )}
                    >
                        <Filter size={12} />
                        Lọc
                        {compareBranchIds.length < branches.length && (
                            <span className="bg-white text-indigo-600 w-4 h-4 rounded-full flex items-center justify-center text-[8px] ml-1">
                                {compareBranchIds.length}
                            </span>
                        )}
                    </button>

                    {showCompareFilter && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={onCloseFilter} />
                            <div className="absolute top-full right-0 mt-2 w-72 z-50 bg-white shadow-2xl rounded-xl border border-zinc-200 p-2 origin-top-right">
                                <div className="flex p-1 bg-zinc-100 rounded-lg mb-2">
                                    <button
                                        onClick={() => onSetFilterTab('branch')}
                                        className={cn(
                                            "flex-1 py-1 text-[10px] font-bold rounded-md transition-all",
                                            filterTab === 'branch' ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                        )}
                                    >
                                        Cơ sở
                                    </button>
                                    <button
                                        onClick={() => onSetFilterTab('room')}
                                        className={cn(
                                            "flex-1 py-1 text-[10px] font-bold rounded-md transition-all",
                                            filterTab === 'room' ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                        )}
                                    >
                                        Loại phòng
                                    </button>
                                </div>

                                <div className="p-1 border-b border-zinc-100 mb-1">
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
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border w-full justify-center",
                                            filterTab === 'branch'
                                                ? compareBranchIds.length === branches.length
                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                                                : compareRoomIds.length === roomTypes.length
                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                                        )}
                                    >
                                        {(
                                            filterTab === 'branch'
                                                ? compareBranchIds.length === branches.length
                                                : compareRoomIds.length === roomTypes.length
                                        ) ? (
                                            <>
                                                <Check size={9} className="text-indigo-600" />
                                                <span className="text-indigo-600">Đã chọn tất cả</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Chọn tất cả</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {filterTab === 'branch' ? (
                                        branches.map(branch => (
                                            <button
                                                key={branch.id}
                                                onClick={() => onToggleBranchFilter(branch.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all",
                                                    compareBranchIds.includes(branch.id)
                                                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                                                        : "text-zinc-600 hover:bg-zinc-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">{branch.name}</div>
                                                {compareBranchIds.includes(branch.id) && <Check size={12} />}
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
                                                        "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all",
                                                        compareRoomIds.includes(room.id)
                                                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                                                            : "text-zinc-600 hover:bg-zinc-50"
                                                    )}
                                                >
                                                    <div className="flex-1 text-left">{room.name}</div>
                                                    <div className="text-[10px] text-zinc-400 font-normal mr-2">{branch?.name}</div>
                                                    {compareRoomIds.includes(room.id) && <Check size={12} />}
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
            <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                {comparisons.length === 0 ? (
                    <div className="p-12 text-center">
                        <Hotel size={40} className="mx-auto text-zinc-200 mb-3" />
                        <p className="text-sm text-zinc-400 italic">Không có lựa chọn nào phù hợp với bộ lọc</p>
                        <button
                            onClick={() => onSelectAll('branch')}
                            className="mt-4 text-[10px] font-black uppercase text-indigo-600 hover:underline"
                        >
                            Khôi phục bộ lọc
                        </button>
                    </div>
                ) : (
                    comparisons.map(({ room, branch, calculation: roomCalc, diff }, idx) => {
                        const branchIdx = branches.findIndex(b => b.id === room.branchId);
                        const theme = BRANCH_THEMES[branchIdx % BRANCH_THEMES.length];
                        const isCheapest = idx === 0 && comparisons.length > 1;

                        return (
                            <div
                                key={room.id}
                                className={cn(
                                    "w-full p-4 flex items-center justify-between transition-all text-left border-l-4",
                                    selectedRoomId === room.id ? cn(theme.bg, theme.border) : cn("border-transparent", theme.bg, "bg-opacity-20")
                                )}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-bold",
                                            selectedRoomId === room.id ? theme.text : "text-zinc-800"
                                        )}>
                                            {room.name}
                                        </span>
                                        {selectedRoomId === room.id && (
                                            <span className={cn("text-[8px] font-bold text-white px-1.5 py-0.5 rounded uppercase", theme.dot)}>Đang chọn</span>
                                        )}
                                        {isCheapest && (
                                            <span className="text-[8px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase shadow-sm shadow-emerald-100">Rẻ nhất</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn("text-[10px] font-bold", theme.text)}>{branch?.name}</span>
                                        <span className="text-[10px] text-zinc-300">•</span>
                                        <span className="text-[10px] text-zinc-400">{branch?.address}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={cn(
                                        "text-sm font-black",
                                        selectedRoomId === room.id ? theme.text : "text-zinc-900"
                                    )}>
                                        {roomCalc ? formatCurrency(roomCalc.finalTotal) : '---'}
                                    </div>
                                    {diff !== 0 && (
                                        <div className={cn(
                                            "text-[10px] font-bold",
                                            diff > 0 ? "text-rose-500" : "text-emerald-500"
                                        )}>
                                            {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}