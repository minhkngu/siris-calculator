import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { SurchargeBanner } from './components/SurchargeBanner';
import { BranchDropdown } from './components/BranchDropdown';
import { RoomDropdown } from './components/RoomDropdown';
import { DateRangePicker } from './components/DateRangePicker';
import { GlobalAdjustmentControl } from './components/GlobalAdjustmentControl';
import { PriceSummary } from './components/PriceSummary';
import { ComparisonPanel } from './components/ComparisonPanel';
import { FetchErrorView } from './components/FetchErrorView';
import { useCalculateForRoom, useComparisons } from './components/useHotelCalculator';
import { supabase } from './lib/supabase';
import { Branch, RoomType, DateAdjustment, GlobalAdjustment, StayDiscount, CalculationResult } from './components/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function App() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [stayDiscounts, setStayDiscounts] = useState<StayDiscount[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  const [checkIn, setCheckIn] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [showDatePicker, setShowDatePicker] = useState<'checkIn' | 'checkOut' | null>(null);

  const [dateAdjustments, setDateAdjustments] = useState<DateAdjustment[]>([]);
  const [globalAdjustment, setGlobalAdjustment] = useState<GlobalAdjustment>({
    type: 'surcharge',
    amount: 0,
    isPercentage: true
  });
  const [includeVAT, setIncludeVAT] = useState(false);
  const [vatRate, setVatRate] = useState(10);

  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showNightlyDetails, setShowNightlyDetails] = useState(false);
  const [showGlobalAdjTypeDropdown, setShowGlobalAdjTypeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  const [compareBranchIds, setCompareBranchIds] = useState<string[]>([]);
  const [compareRoomIds, setCompareRoomIds] = useState<string[]>([]);
  const [showCompareFilter, setShowCompareFilter] = useState(false);
  const [filterTab, setFilterTab] = useState<'branch' | 'room'>('branch');

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setFetchError(null);
      const [
        { data: bData, error: bErr },
        { data: rRaw, error: rErr },
        { data: dRaw, error: dErr },
        { data: aRaw, error: aErr }
      ] = await Promise.all([
        supabase.from('branches').select('*'),
        supabase.from('room_types').select('*'),
        supabase.from('stay_discounts').select('*'),
        supabase.from('date_adjustments').select('*')
      ]);

      if (bErr || rErr || dErr || aErr) {
        throw new Error((bErr || rErr || dErr || aErr)?.message || 'Lỗi khi tải dữ liệu từ Supabase');
      }

      const rData = (rRaw || []).map((r: any) => ({
        id: r.id,
        branchId: r.branch_id || r.branchId || r.branchid,
        name: r.name,
        weekdayPrice: r.weekday_price || r.weekdayPrice || r.weekdayprice || 0,
        weekendPrice: r.weekend_price || r.weekendPrice || r.weekendprice || 0
      }));

      const dData = (dRaw || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        minNights: Number(d.minnights || 0),
        discountAmount: Number(d.discountamount || 0),
        isPercentage: d.ispercentage === true || d.ispercentage === 1 || String(d.ispercentage).toLowerCase() === 'true'
      })).sort((a, b) => b.minNights - a.minNights);

      const aData = (aRaw || []).map((a: any) => ({
        id: a.id,
        date: a.date,
        type: a.type,
        amount: Number(a.amount || 0),
        isPercentage: a.ispercentage === true || a.ispercentage === 1 || String(a.ispercentage).toLowerCase() === 'true' || a.is_percentage === true || a.is_percentage === 1,
        note: a.note
      }));

      setBranches(bData || []);
      setRoomTypes(rData.sort((a, b) => a.weekdayPrice - b.weekdayPrice));
      setStayDiscounts(dData);
      setDateAdjustments(aData);

      setCompareBranchIds((bData || []).map(b => b.id));
      setCompareRoomIds(rData.map(r => r.id));

      if (bData && bData.length > 0) {
        if (!selectedBranchId || !bData.find(b => b.id === selectedBranchId)) {
          setSelectedBranchId(bData[0].id);
        }
      }
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setFetchError(error.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRoomTypes = useMemo(() =>
    roomTypes.filter(r => r.branchId === selectedBranchId)
    , [roomTypes, selectedBranchId]);

  useEffect(() => {
    if (filteredRoomTypes.length > 0) {
      const currentRoomExists = filteredRoomTypes.some(r => r.id === selectedRoomId);
      if (!currentRoomExists) {
        setSelectedRoomId(filteredRoomTypes[0].id);
      }
    } else if (selectedRoomId !== '') {
      setSelectedRoomId('');
    }
  }, [filteredRoomTypes, selectedRoomId]);

  const selectedRoom = useMemo(() =>
    roomTypes.find(r => r.id === selectedRoomId)
    , [roomTypes, selectedRoomId]);

  const calculation = useCalculateForRoom(selectedRoom, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate);

  const comparisons = useComparisons(roomTypes, branches, compareBranchIds, compareRoomIds, selectedRoom, calculation, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  if (fetchError) return <FetchErrorView message={fetchError} />;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Phần mềm tính tiền phòng</h1>
        </div>

        <SurchargeBanner adjustments={dateAdjustments} />

        <div className="space-y-8">
          <section className="bg-zinc-50/30 rounded-3xl shadow-xl border border-zinc-300/50 overflow-visible relative z-30">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y divide-zinc-200 md:divide-zinc-200 xl:divide-y-0 xl:divide-x">
              <BranchDropdown
                branches={branches}
                selectedBranchId={selectedBranchId}
                showDropdown={showBranchDropdown}
                onToggle={() => setShowBranchDropdown(!showBranchDropdown)}
                onSelect={(id) => setSelectedBranchId(id)}
              />
              <RoomDropdown
                roomTypes={filteredRoomTypes}
                selectedRoomId={selectedRoomId}
                showDropdown={showRoomDropdown}
                onToggle={() => setShowRoomDropdown(!showRoomDropdown)}
                onSelect={(id) => setSelectedRoomId(id)}
                formatCurrency={formatCurrency}
              />
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                showDatePicker={showDatePicker}
                calculation={calculation}
                onToggle={(type) => setShowDatePicker(showDatePicker === type ? null : type)}
                onChange={(type, date) => {
                  if (type === 'checkIn') setCheckIn(date);
                  else setCheckOut(date);
                }}
                onClose={() => setShowDatePicker(null)}
              />
              <GlobalAdjustmentControl
                globalAdjustment={globalAdjustment}
                showDropdown={showGlobalAdjTypeDropdown}
                onToggleDropdown={() => setShowGlobalAdjTypeDropdown(!showGlobalAdjTypeDropdown)}
                onCloseDropdown={() => setShowGlobalAdjTypeDropdown(false)}
                onTypeChange={(type) => setGlobalAdjustment({ ...globalAdjustment, type })}
                onAmountChange={(amount) => setGlobalAdjustment({ ...globalAdjustment, amount })}
                onTogglePercentage={() => setGlobalAdjustment({ ...globalAdjustment, isPercentage: !globalAdjustment.isPercentage })}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <PriceSummary
                calculation={calculation}
                globalAdjustment={globalAdjustment}
                includeVAT={includeVAT}
                vatRate={vatRate}
                showNightlyDetails={showNightlyDetails}
                onToggleNightlyDetails={() => setShowNightlyDetails(!showNightlyDetails)}
                onToggleVAT={(checked) => setIncludeVAT(checked)}
                onVatRateChange={(rate) => setVatRate(rate)}
                formatCurrency={formatCurrency}
              />
            </div>
            <div className="lg:col-span-7">
              <ComparisonPanel
                comparisons={comparisons}
                branches={branches}
                roomTypes={roomTypes}
                compareBranchIds={compareBranchIds}
                compareRoomIds={compareRoomIds}
                showCompareFilter={showCompareFilter}
                filterTab={filterTab}
                selectedRoomId={selectedRoomId}
                onToggleFilter={() => setShowCompareFilter(!showCompareFilter)}
                onCloseFilter={() => setShowCompareFilter(false)}
                onSetFilterTab={(tab) => setFilterTab(tab)}
                onToggleBranchFilter={(id) => setCompareBranchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                onToggleRoomFilter={(id) => setCompareRoomIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                onSelectAll={(tab) => {
                  if (tab === 'branch') setCompareBranchIds(branches.map(b => b.id));
                  else setCompareRoomIds(roomTypes.map(r => r.id));
                }}
                onDeselectAll={(tab) => {
                  if (tab === 'branch') setCompareBranchIds([]);
                  else setCompareRoomIds([]);
                }}
                onSelect={(branchId, roomId) => {
                  setSelectedBranchId(branchId);
                  setSelectedRoomId(roomId);
                }}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </div>
      </main>
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-zinc-200 text-center">
        <p className="text-sm text-zinc-400">© 2026 Hotel Price Calculator. Built for efficiency.</p>
      </footer>
    </div>
  );
}