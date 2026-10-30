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
  onSelectRoom?: (branchId: string, roomId: string) => void;
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
  onSelectRoom,
  formatCurrency,
}: ComparisonPanelProps) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Bảng so sánh hạng phòng</h3>
          <p className="text-xs text-slate-500">Bấm vào phòng để xem chênh lệch nâng/hạ hạng</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={onToggleFilter}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              compareBranchIds.length < branches.length || compareRoomIds.length < roomTypes.length
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            <Filter size={13} />
            <span>Lọc</span>
            {compareBranchIds.length < branches.length && (
              <span className="bg-white text-slate-900 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                {compareBranchIds.length}
              </span>
            )}
          </button>

          {showCompareFilter && (
            <>
              <div className="fixed inset-0 z-40" onClick={onCloseFilter} />
              <div className="absolute top-full right-0 mt-1.5 w-64 z-50 bg-white shadow-xl rounded-xl border border-slate-200 p-2 origin-top-right">
                <div className="flex p-0.5 bg-slate-100 rounded-lg mb-2">
                  <button
                    type="button"
                    onClick={() => onSetFilterTab('branch')}
                    className={cn(
                      "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                      filterTab === 'branch' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Cơ sở
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetFilterTab('room')}
                    className={cn(
                      "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                      filterTab === 'room' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Loại phòng
                  </button>
                </div>

                <div className="flex justify-between items-center px-1 mb-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {filterTab === 'branch' ? 'Chọn chi nhánh' : 'Chọn loại phòng'}
                  </span>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onSelectAll(filterTab)}
                      className="text-slate-900 hover:underline font-semibold"
                    >
                      Tất cả
                    </button>
                    <span className="text-slate-200">·</span>
                    <button
                      type="button"
                      onClick={() => onDeselectAll(filterTab)}
                      className="text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {filterTab === 'branch'
                    ? branches.map((branch) => (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => onToggleBranchFilter(branch.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                            compareBranchIds.includes(branch.id)
                              ? "bg-slate-100 text-slate-900 font-semibold"
                              : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span>{branch.name}</span>
                          {compareBranchIds.includes(branch.id) && <Check size={13} />}
                        </button>
                      ))
                    : branches
                        .filter((branch) => compareBranchIds.length === 0 || compareBranchIds.includes(branch.id))
                        .map((branch) => {
                          const rooms = roomTypes.filter((room) => room.branchId === branch.id);
                          if (!rooms.length) return null;
                          const color = branches.findIndex((item) => item.id === branch.id) % 2 === 0
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-emerald-100 text-emerald-800";
                          return (
                            <div key={branch.id} className="pt-1">
                              <span className={cn("inline-block mx-2 mb-1 px-1.5 py-0.5 rounded text-[10px] font-semibold", color)}>{branch.name}</span>
                              {rooms.map((room) => (
                                <button
                                  key={room.id}
                                  type="button"
                                  onClick={() => onToggleRoomFilter(room.id)}
                                  className={cn(
                                    "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                                    compareRoomIds.includes(room.id)
                                      ? "bg-slate-100 text-slate-900 font-semibold"
                                      : "text-slate-600 hover:bg-slate-50"
                                  )}
                                >
                                  <span>{room.name}</span>
                                  {compareRoomIds.includes(room.id) && <Check size={13} className="shrink-0" />}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid of rooms */}
      {comparisons.length === 0 ? (
        <div className="py-8 text-center">
          <Hotel size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs text-slate-400">Không có hạng phòng nào khớp bộ lọc</p>
          <button
            type="button"
            onClick={() => onSelectAll('branch')}
            className="mt-2 text-xs font-semibold text-slate-900 hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {comparisons.map(({ room, branch, calculation: roomCalc, diff }) => {
            const isSelected = selectedRoomId === room.id;
            const branchColor = branches.findIndex((item) => item.id === branch?.id) % 2 === 0
              ? "bg-indigo-100 text-indigo-800"
              : "bg-emerald-100 text-emerald-800";

            return (
              <button
                key={room.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectRoom && onSelectRoom(room.branchId, room.id)}
                className={cn(
                  "w-full h-full flex flex-col text-left rounded-lg border p-2.5 transition-all cursor-pointer",
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                )}
              >
                <div className="flex items-start justify-between gap-1 mb-1 min-h-[2.25rem]">
                  <span className={cn("text-xs font-semibold min-w-0 break-words", isSelected ? "text-white" : "text-slate-900")}>
                    {room.name}
                  </span>
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0", branchColor)}>
                    {branch?.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-x-1 mt-auto">
                  <div className={cn("text-xs sm:text-sm font-bold tabular-nums", isSelected ? "text-white" : "text-slate-900")}>
                    {roomCalc ? formatCurrency(roomCalc.finalTotal) : '—'}
                  </div>
                  {diff !== 0 && (
                    <div
                      className={cn(
                        "text-[11px] font-bold tabular-nums",
                        diff > 0
                          ? isSelected
                            ? "text-rose-300"
                            : "text-rose-600"
                          : isSelected
                            ? "text-emerald-300"
                            : "text-emerald-600"
                      )}
                    >
                      {diff > 0 ? `+${formatCurrency(diff)}` : `−${formatCurrency(Math.abs(diff))}`}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
