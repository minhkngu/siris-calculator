import { memo, useCallback, useMemo } from 'react';
import { SurchargeBanner } from '../../components/SurchargeBanner';
import { BranchDropdown } from '../../components/BranchDropdown';
import { RoomDropdown } from '../../components/RoomDropdown';
import { DateRangePicker } from '../../components/DateRangePicker';
import { GlobalAdjustmentControl } from '../../components/GlobalAdjustmentControl';
import { PriceSummary } from '../../components/PriceSummary';
import { BookingSummary } from '../../components/BookingSummary';
import { ComparisonPanel } from '../../components/ComparisonPanel';
import type {
  Branch,
  StayDiscount,
  CalculationResult,
  ComparisonItem,
  DateAdjustment,
  EarlyCheckinLateCheckoutType,
  GlobalAdjustment,
  RoomType,
} from '../../components/types';

export interface RoomViewProps {
  promotions: StayDiscount[];
  onToggleManualPromotion: (id: string) => void;
  branches: Branch[];
  roomTypes: RoomType[];
  filteredRoomTypes: RoomType[];
  dateAdjustments: DateAdjustment[];
  selectedBranchId: string;
  selectedRoomId: string;
  checkIn: string;
  checkOut: string;
  showDatePicker: 'checkIn' | 'checkOut' | null;
  calculation: CalculationResult | null;
  comparisons: ComparisonItem[];
  comparisonRoom: RoomType | undefined;
  comparisonCalculation: CalculationResult | null;
  comparisonDifference: number;
  comparisonVatDifference: number;
  comparisonName: string;
  paidAmount: number;
  globalAdjustment: GlobalAdjustment;
  selectedEarlyLateOptions: Set<EarlyCheckinLateCheckoutType>;
  showBranchDropdown: boolean;
  showRoomDropdown: boolean;
  showNightlyDetails: boolean;
  showGlobalAdjTypeDropdown: boolean;
  showCompareFilter: boolean;
  filterTab: 'branch' | 'room';
  comparisonRoomId: string | null;
  compareBranchIds: string[];
  compareRoomIds: string[];
  onToggleBranchDropdown: () => void;
  onSelectBranch: (branchId: string) => void;
  onToggleRoomDropdown: () => void;
  onSelectRoom: (roomId: string) => void;
  onToggleDatePicker: (type: 'checkIn' | 'checkOut') => void;
  onChangeDate: (type: 'checkIn' | 'checkOut', date: string) => void;
  onCloseDatePicker: () => void;
  onToggleGlobalAdjDropdown: () => void;
  onCloseGlobalAdjDropdown: () => void;
  onGlobalAdjTypeChange: (type: 'surcharge' | 'discount') => void;
  onGlobalAdjAmountChange: (amount: number) => void;
  onToggleGlobalAdjPercentage: () => void;
  onPaidAmountChange: (amount: number) => void;
  onToggleNightlyDetails: () => void;
  onToggleEarlyLateOption: (type: EarlyCheckinLateCheckoutType) => void;
  onToggleCompareFilter: () => void;
  onCloseCompareFilter: () => void;
  onSetFilterTab: (tab: 'branch' | 'room') => void;
  onToggleBranchFilter: (branchId: string) => void;
  onToggleRoomFilter: (roomId: string) => void;
  onSelectAllCompare: (tab: 'branch' | 'room') => void;
  onDeselectAllCompare: (tab: 'branch' | 'room') => void;
  onSelectComparisonRoom: (roomId: string) => void;
  formatCurrency: (amount: number) => string;
}

function RoomViewBase({
  promotions,
  onToggleManualPromotion,
  branches,
  roomTypes,
  filteredRoomTypes,
  dateAdjustments,
  selectedBranchId,
  selectedRoomId,
  checkIn,
  checkOut,
  showDatePicker,
  calculation,
  comparisons,
  comparisonRoom,
  comparisonCalculation,
  comparisonDifference,
  comparisonVatDifference,
  comparisonName,
  paidAmount,
  globalAdjustment,
  selectedEarlyLateOptions,
  showBranchDropdown,
  showRoomDropdown,
  showNightlyDetails,
  showGlobalAdjTypeDropdown,
  showCompareFilter,
  filterTab,
  comparisonRoomId,
  compareBranchIds,
  compareRoomIds,
  onToggleBranchDropdown,
  onSelectBranch,
  onToggleRoomDropdown,
  onSelectRoom,
  onToggleDatePicker,
  onChangeDate,
  onCloseDatePicker,
  onToggleGlobalAdjDropdown,
  onCloseGlobalAdjDropdown,
  onGlobalAdjTypeChange,
  onGlobalAdjAmountChange,
  onToggleGlobalAdjPercentage,
  onPaidAmountChange,
  onToggleNightlyDetails,
  onToggleEarlyLateOption,
  onToggleCompareFilter,
  onCloseCompareFilter,
  onSetFilterTab,
  onToggleBranchFilter,
  onToggleRoomFilter,
  onSelectAllCompare,
  onDeselectAllCompare,
  onSelectComparisonRoom,
  formatCurrency,
}: RoomViewProps) {
  const selectedBranchName = branches.find((branch) => branch.id === selectedBranchId)?.name || '';
  const selectedRoom = roomTypes.find((room) => room.id === selectedRoomId);
  const comparisonBranchName = branches.find((branch) => branch.id === comparisonRoom?.branchId)?.name || '';
  const comparisonRoomName = comparisonRoom?.name || '';

  const handleSelectComparisonRoom = useCallback(
    (_branchId: string, roomId: string) => onSelectComparisonRoom(roomId),
    [onSelectComparisonRoom],
  );

  const bookingSummary = useMemo(() => (
    <BookingSummary
      calculation={calculation}
      comparisonCalculation={comparisonCalculation}
      comparisonDifference={comparisonDifference}
      comparisonVatDifference={comparisonVatDifference}
      comparisonBranchName={comparisonBranchName}
      comparisonRoomName={comparisonRoomName}
      comparisonName={comparisonName}
      paidAmount={paidAmount}
      globalAdjustment={globalAdjustment}
      selectedEarlyLateOptions={selectedEarlyLateOptions}
      checkIn={checkIn}
      checkOut={checkOut}
      branchName={selectedBranchName}
      roomName={selectedRoom?.name || ''}
      formatCurrency={formatCurrency}
    />
  ), [
    calculation, comparisonCalculation, comparisonDifference, comparisonVatDifference,
    comparisonBranchName, comparisonRoomName, comparisonName, paidAmount, globalAdjustment,
    selectedEarlyLateOptions, checkIn, checkOut, selectedBranchName, selectedRoom?.name, formatCurrency,
  ]);

  return (
    <>
      <SurchargeBanner adjustments={dateAdjustments} />

      <div className="space-y-5 sm:space-y-6">
        {/* Top Configuration Console */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible relative z-30">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <BranchDropdown
              branches={branches}
              selectedBranchId={selectedBranchId}
              showDropdown={showBranchDropdown}
              onToggle={onToggleBranchDropdown}
              onSelect={onSelectBranch}
            />
            <RoomDropdown
              roomTypes={filteredRoomTypes}
              selectedRoomId={selectedRoomId}
              showDropdown={showRoomDropdown}
              onToggle={onToggleRoomDropdown}
              onSelect={onSelectRoom}
              formatCurrency={formatCurrency}
            />

            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              showDatePicker={showDatePicker}
              calculation={calculation}
              onToggle={onToggleDatePicker}
              onChange={onChangeDate}
              onClose={onCloseDatePicker}
            />
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
        </section>

        {/* Dual Column Layout: Price Quote (Left) & Comparisons + Quote Assistant (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          <div className="lg:col-span-5">
            <PriceSummary
              onToggleManualPromotion={onToggleManualPromotion}
              promotions={promotions}
              calculation={calculation}
              comparisonCalculation={comparisonCalculation}
              comparisonDifference={comparisonDifference}
              comparisonVatDifference={comparisonVatDifference}
              mobileBookingSummary={bookingSummary}
              comparisonName={comparisonName}
              originalRoomName={`${selectedRoom?.name || ''} (${selectedBranchName})`}
              paidAmount={paidAmount}
              onPaidAmountChange={onPaidAmountChange}
              globalAdjustment={globalAdjustment}
              showNightlyDetails={showNightlyDetails}
              onToggleNightlyDetails={onToggleNightlyDetails}
              formatCurrency={formatCurrency}
              selectedEarlyLateOptions={selectedEarlyLateOptions}
              onToggleEarlyLateOption={onToggleEarlyLateOption}
              checkOut={checkOut}
            />
          </div>
          <div className="lg:col-span-7 space-y-5">
            <div className="hidden lg:block">{bookingSummary}</div>
            <ComparisonPanel
              comparisons={comparisons}
              branches={branches}
              roomTypes={roomTypes}
              compareBranchIds={compareBranchIds}
              compareRoomIds={compareRoomIds}
              showCompareFilter={showCompareFilter}
              filterTab={filterTab}
              selectedRoomId={comparisonRoomId || selectedRoomId}
              onToggleFilter={onToggleCompareFilter}
              onCloseFilter={onCloseCompareFilter}
              onSetFilterTab={onSetFilterTab}
              onToggleBranchFilter={onToggleBranchFilter}
              onToggleRoomFilter={onToggleRoomFilter}
              onSelectAll={onSelectAllCompare}
              onDeselectAll={onDeselectAllCompare}
              onSelectRoom={handleSelectComparisonRoom}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export const RoomView = memo(RoomViewBase);
