import type { ServiceRule } from '../../lib/serviceRules';
import { lazy, memo } from 'react';
import { GlobalAdjustmentControl } from '../../components/GlobalAdjustmentControl';
import type {
  Branch,
  StayDiscount,
  EarlyCheckinLateCheckoutType,
  GlobalAdjustment,
  MultiRoomTotalSummary,
  RoomType,
  SelectedRoomItem,
} from '../../components/types';

const loadMultiSelector = () => import('../../components/MultiRoomSelector')
  .then(module => ({ default: module.MultiRoomSelector }));
const loadMultiSummary = () => import('../../components/MultiRoomSummary')
  .then(module => ({ default: module.MultiRoomSummary }));

export const preloadMultiRoomView = () => Promise.all([loadMultiSelector(), loadMultiSummary()])
  .then(() => undefined);

const MultiRoomSelector = lazy(loadMultiSelector);
const MultiRoomSummary = lazy(loadMultiSummary);

export interface MultiRoomViewProps {
  serviceRules: ServiceRule[];
  promotions: StayDiscount[];
  onToggleManualPromotion: (id: string) => void;
  rooms: SelectedRoomItem[];
  branches: Branch[];
  roomTypes: RoomType[];
  summary: MultiRoomTotalSummary;
  globalAdjustment: GlobalAdjustment;
  includeVAT: boolean;
  vatRate: number;
  showGlobalAdjTypeDropdown: boolean;
  onAddRoom: () => void;
  onDuplicateRoom: (index: number) => void;
  onRemoveRoom: (index: number) => void;
  onUpdateRoom: (index: number, updates: Partial<SelectedRoomItem>) => void;
  onToggleEarlyLate: (index: number, type: EarlyCheckinLateCheckoutType) => void;
  onToggleGlobalAdjDropdown: () => void;
  onCloseGlobalAdjDropdown: () => void;
  onGlobalAdjTypeChange: (type: 'surcharge' | 'discount') => void;
  onGlobalAdjAmountChange: (amount: number) => void;
  onToggleGlobalAdjPercentage: () => void;
  onToggleIncludeRoom: (index: number) => void;
  formatCurrency: (amount: number) => string;
}

function MultiRoomViewBase({
  serviceRules,
  promotions,
  onToggleManualPromotion,
  rooms,
  branches,
  roomTypes,
  summary,
  globalAdjustment,
  includeVAT,
  vatRate,
  showGlobalAdjTypeDropdown,
  onAddRoom,
  onDuplicateRoom,
  onRemoveRoom,
  onUpdateRoom,
  onToggleEarlyLate,
  onToggleGlobalAdjDropdown,
  onCloseGlobalAdjDropdown,
  onGlobalAdjTypeChange,
  onGlobalAdjAmountChange,
  onToggleGlobalAdjPercentage,
  onToggleIncludeRoom,
  formatCurrency,
}: MultiRoomViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <MultiRoomSelector
            serviceRules={serviceRules}
            rooms={rooms}
            branches={branches}
            roomTypes={roomTypes}
            summary={summary}
            onAddRoom={onAddRoom}
            onDuplicateRoom={onDuplicateRoom}
            onRemoveRoom={onRemoveRoom}
            onUpdateRoom={onUpdateRoom}
            onToggleEarlyLate={onToggleEarlyLate}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="lg:col-span-5 space-y-4 sticky top-20">
          {/* Global adjustment control in multi-room mode */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 relative z-30">
            <GlobalAdjustmentControl
              globalAdjustment={globalAdjustment}
              showDropdown={showGlobalAdjTypeDropdown}
              onToggleDropdown={onToggleGlobalAdjDropdown}
              onCloseDropdown={onCloseGlobalAdjDropdown}
              onTypeChange={onGlobalAdjTypeChange}
              onAmountChange={onGlobalAdjAmountChange}
              onTogglePercentage={onToggleGlobalAdjPercentage}
            />
          </div>

          <MultiRoomSummary
            onToggleManualPromotion={onToggleManualPromotion}
            promotions={promotions}
            summary={summary}
            globalAdjustment={globalAdjustment}
            includeVAT={includeVAT}
            vatRate={vatRate}
            onToggleIncludeRoom={onToggleIncludeRoom}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
}

export const MultiRoomView = memo(MultiRoomViewBase);
