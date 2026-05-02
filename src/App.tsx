import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  addDays, 
  getDay, 
  eachDayOfInterval, 
  parseISO,
  isSameDay,
  isValid,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { 
  Calendar as CalendarIcon, 
  Calculator, 
  Hotel, 
  Tag, 
  Percent, 
  DollarSign,
  ChevronDown,
  ArrowUpDown,
  Building,
  Filter,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  Branch,
  RoomType, 
  DateAdjustment, 
  GlobalAdjustment, 
  StayDiscount
} from './types';
import { SurchargeBanner } from './components/SurchargeBanner';

const BRANCH_THEMES = [
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', shadow: 'shadow-indigo-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', shadow: 'shadow-emerald-100' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', shadow: 'shadow-amber-100' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', shadow: 'shadow-rose-100' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', shadow: 'shadow-violet-100' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', shadow: 'shadow-cyan-100' },
];

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
  const [showGlobalAdjTypeDropdown, setShowGlobalAdjTypeDropdown] = useState<'global' | null>(null);
  const [loading, setLoading] = useState(true);

  const [compareBranchIds, setCompareBranchIds] = useState<string[]>([]);
  const [compareRoomIds, setCompareRoomIds] = useState<string[]>([]);
  const [showCompareFilter, setShowCompareFilter] = useState(false);
  const [filterTab, setFilterTab] = useState<'branch' | 'room'>('branch');

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setFetchError(null);
      const [bRes, rRes, dRes, aRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/room-types'),
        fetch('/api/stay-discounts'),
        fetch('/api/date-adjustments')
      ]);
      
      if (!bRes.ok || !rRes.ok || !dRes.ok || !aRes.ok) {
        const failedRes = [bRes, rRes, dRes, aRes].find(r => !r.ok);
        if (failedRes) {
          const errorData = await failedRes.json().catch(() => ({ error: 'Lỗi không xác định' }));
          throw new Error(errorData.error || `Lỗi máy chủ (${failedRes.status})`);
        }
        throw new Error('Lỗi khi tải dữ liệu từ máy chủ');
      }

      const bData = await bRes.json();
      const rData = await rRes.json();
      const dData = await dRes.json();
      const aData = await aRes.json();
      
      console.log("Branches loaded:", bData);
      console.log("Room Types loaded:", rData);

      setBranches(bData);
      setRoomTypes(rData.sort((a: RoomType, b: RoomType) => a.weekdayPrice - b.weekdayPrice));
      setStayDiscounts(dData);
      setDateAdjustments(aData);
      console.log("Data fetched in App.tsx:", aData);
      setCompareBranchIds(bData.map((b: Branch) => b.id));
      setCompareRoomIds(rData.sort((a: RoomType, b: RoomType) => a.weekdayPrice - b.weekdayPrice).map((r: RoomType) => r.id));

      if (bData.length > 0) {
        // If no branch selected, or current selected branch is not in the new data
        if (!selectedBranchId || !bData.find((b: Branch) => b.id === selectedBranchId)) {
          setSelectedBranchId(bData[0].id);
        }
      }
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setFetchError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const calculateForRoom = (room: RoomType) => {
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    
    if (!isValid(start) || !isValid(end) || end <= start) return null;

    const nights = eachDayOfInterval({
      start,
      end: addDays(end, -1)
    });

    let totalBase = 0;
    const breakdown = nights.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = getDay(date);
      const isWknd = dayOfWeek === 5 || dayOfWeek === 6; // Friday = 5, Saturday = 6
      const basePrice = isWknd ? room.weekendPrice : room.weekdayPrice;
      
      const adjustments = dateAdjustments.filter(adj => adj.date === dateStr);
      let adjustedPrice = basePrice;
      
      adjustments.forEach(adj => {
        const value = adj.isPercentage ? (basePrice * adj.amount / 100) : adj.amount;
        if (adj.type === 'surcharge') {
          adjustedPrice += value;
        } else {
          adjustedPrice -= value;
        }
      });

      totalBase += adjustedPrice;

      let vatPerNight = 0;
      if (includeVAT) {
        vatPerNight = adjustedPrice * (vatRate / 100);
      }

      return {
        date: dateStr,
        isWeekend: isWknd,
        basePrice,
        adjustments,
        finalPrice: adjustedPrice,
        vatPerNight
      };
    });

    let finalTotal = totalBase;
    const globalValue = globalAdjustment.isPercentage 
      ? (totalBase * globalAdjustment.amount / 100) 
      : globalAdjustment.amount;

    if (globalAdjustment.type === 'surcharge') {
      finalTotal += globalValue;
    } else {
      finalTotal -= globalValue;
    }

    // Apply stay discounts
    const nightCount = breakdown.length;
    const applicableStayDiscounts = stayDiscounts
      .filter(d => nightCount >= d.minNights)
      .sort((a, b) => b.minNights - a.minNights); // Get the highest minNights first
    
    const bestStayDiscount = applicableStayDiscounts[0];
    let stayDiscountValue = 0;
    if (bestStayDiscount) {
      stayDiscountValue = bestStayDiscount.isPercentage 
        ? (finalTotal * bestStayDiscount.discountAmount / 100)
        : bestStayDiscount.discountAmount;
      finalTotal -= stayDiscountValue;
    }

    let vatValue = 0;
    if (includeVAT) {
      vatValue = finalTotal * (vatRate / 100);
      finalTotal += vatValue;
    }

    const deposit = finalTotal * 0.5;

    return {
      nights: breakdown,
      totalBase,
      globalAdjustmentValue: globalValue,
      stayDiscount: bestStayDiscount,
      stayDiscountValue,
      vatValue,
      finalTotal,
      deposit
    };
  };

  const calculation = useMemo(() => {
    if (!selectedRoom) return null;
    return calculateForRoom(selectedRoom);
  }, [checkIn, checkOut, selectedRoom, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate]);

  const comparisons = useMemo(() => {
    if (!selectedRoom || !calculation) return [];
    
    return roomTypes
      .filter(r => compareBranchIds.includes(r.branchId) && compareRoomIds.includes(r.id))
      .map(r => {
        const calc = calculateForRoom(r);
        const branch = branches.find(b => b.id === r.branchId);
        return {
          room: r,
          branch,
          calculation: calc,
          diff: calc ? calc.finalTotal - calculation.finalTotal : 0
        };
      })
      .sort((a, b) => (a.calculation?.finalTotal || 0) - (b.calculation?.finalTotal || 0));
  }, [calculation, roomTypes, branches, compareBranchIds, compareRoomIds]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calculator size={32} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-zinc-500 mb-8">{fetchError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Phần mềm tính tiền phòng</h1>
        </div>
        
        <SurchargeBanner adjustments={dateAdjustments} />

        <div className="space-y-8">
            {/* Modern Booking Bar */}
            <section className="bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-visible relative z-30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-x divide-zinc-200">
                
                {/* Branch Selection Dropdown */}
                <div className="relative p-4 lg:p-6">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">Cơ sở</label>
                  <button 
                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    className="w-full flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        selectedBranchId ? BRANCH_THEMES[branches.findIndex(b => b.id === selectedBranchId) % BRANCH_THEMES.length].bg : "bg-zinc-100"
                      )}>
                        <Building size={18} className={cn(
                          selectedBranchId ? BRANCH_THEMES[branches.findIndex(b => b.id === selectedBranchId) % BRANCH_THEMES.length].text : "text-zinc-400"
                        )} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-zinc-900 truncate max-w-[150px]">
                          {branches.find(b => b.id === selectedBranchId)?.name || 'Chọn cơ sở'}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                          {branches.find(b => b.id === selectedBranchId)?.address || 'Vị trí'}
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", showBranchDropdown && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {showBranchDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowBranchDropdown(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-white shadow-2xl rounded-2xl border border-zinc-200 p-2 z-50 overflow-hidden"
                        >
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {branches.map((branch, idx) => {
                              const theme = BRANCH_THEMES[idx % BRANCH_THEMES.length];
                              return (
                                <button
                                  key={branch.id}
                                  onClick={() => {
                                    setSelectedBranchId(branch.id);
                                    setShowBranchDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left mb-1 last:mb-0",
                                    selectedBranchId === branch.id 
                                      ? cn(theme.bg, theme.text, "font-bold") 
                                      : "hover:bg-zinc-50 text-zinc-600"
                                  )}
                                >
                                  <div className={cn("w-2 h-2 rounded-full", theme.dot)} />
                                  <div className="flex-1">
                                    <div className="text-sm">{branch.name}</div>
                                    <div className="text-[10px] opacity-70">{branch.address}</div>
                                  </div>
                                  {selectedBranchId === branch.id && <Check size={14} />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Room Selection Dropdown */}
                <div className="relative p-4 lg:p-6">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">Loại phòng</label>
                  <button 
                    onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                    className="w-full flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-100 text-zinc-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Hotel size={18} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">
                          {roomTypes.find(r => r.id === selectedRoomId)?.name || 'Chọn loại phòng'}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex gap-2">
                          {selectedRoomId ? (
                            <>
                              <span>CN-T5: {formatCurrency(roomTypes.find(r => r.id === selectedRoomId)?.weekdayPrice || 0)}</span>
                              <span className="opacity-30">|</span>
                              <span>T6-T7: {formatCurrency(roomTypes.find(r => r.id === selectedRoomId)?.weekendPrice || 0)}</span>
                            </>
                          ) : 'Giá phòng'}
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", showRoomDropdown && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {showRoomDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowRoomDropdown(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white shadow-2xl rounded-2xl border border-zinc-200 p-2 z-50 overflow-hidden"
                        >
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {filteredRoomTypes.length === 0 ? (
                              <div className="p-4 text-center text-zinc-400 text-xs italic">
                                Cơ sở này chưa có loại phòng nào.
                              </div>
                            ) : (
                              filteredRoomTypes.map((room) => (
                                <button
                                  key={room.id}
                                  onClick={() => {
                                    setSelectedRoomId(room.id);
                                    setShowRoomDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full p-3 rounded-xl transition-all text-left mb-1 last:mb-0 border",
                                    selectedRoomId === room.id 
                                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold" 
                                      : "border-transparent hover:bg-zinc-50 text-zinc-600"
                                  )}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">{room.name}</span>
                                    {selectedRoomId === room.id && <Check size={14} />}
                                  </div>
                                  <div className="flex gap-3 mt-1 opacity-70">
                                    <span className="text-[10px]">CN-T5: {formatCurrency(room.weekdayPrice)}</span>
                                    <span className="text-[10px]">T6-T7: {formatCurrency(room.weekendPrice)}</span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Stay Duration Picker */}
                <div className="p-4 lg:p-6 relative">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">
                    Thời gian lưu trú
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-100 hover:border-indigo-200 transition-all">
                    <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-200">
                      <button 
                        onClick={() => setShowDatePicker(showDatePicker === 'checkIn' ? null : 'checkIn')}
                        className="px-3 text-left group"
                      >
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Nhận phòng</div>
                        <div className="text-sm font-black text-zinc-900 group-hover:text-indigo-600 transition-colors">
                          {checkIn ? format(parseISO(checkIn), 'dd/MM/yyyy') : 'Chọn'}
                        </div>
                      </button>
                      <button 
                        onClick={() => setShowDatePicker(showDatePicker === 'checkOut' ? null : 'checkOut')}
                        className="px-3 text-left group"
                      >
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Trả phòng</div>
                        <div className="text-sm font-black text-zinc-900 group-hover:text-indigo-600 transition-colors">
                          {checkOut ? format(parseISO(checkOut), 'dd/MM/yyyy') : 'Chọn'}
                        </div>
                      </button>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <div className="text-center">
                        <div className="text-[10px] font-black leading-none">{calculation?.nights.length || 0}</div>
                        <div className="text-[7px] uppercase font-bold">đêm</div>
                      </div>
                    </div>
                  </div>

                  {/* Date Picker Modals */}
                  <AnimatePresence>
                    {showDatePicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(null)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={cn(
                            "absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl rounded-2xl border border-zinc-200 p-4 z-50 flex justify-center",
                            showDatePicker === 'checkIn' ? "md:left-0 md:right-auto" : "md:right-0 md:left-auto"
                          )}
                        >
                          <DayPicker
                            mode="single"
                            captionLayout="dropdown"
                            fromYear={2024}
                            toYear={2030}
                            selected={showDatePicker === 'checkIn' ? (checkIn ? parseISO(checkIn) : undefined) : (checkOut ? parseISO(checkOut) : undefined)}
                            onSelect={(date) => {
                              if (date) {
                                if (showDatePicker === 'checkIn') {
                                  setCheckIn(format(date, 'yyyy-MM-dd'));
                                } else {
                                  setCheckOut(format(date, 'yyyy-MM-dd'));
                                }
                                setShowDatePicker(null);
                              }
                            }}
                            locale={vi}
                            disabled={showDatePicker === 'checkOut' && checkIn ? { before: addDays(parseISO(checkIn), 1) } : { before: new Date() }}
                          />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Global Adjustment */}
                <div className="p-4 lg:p-6">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">Điều chỉnh tổng đơn</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-zinc-50 rounded-2xl border border-zinc-200 p-1.5 group hover:border-indigo-300 transition-all shadow-sm">
                      <div className="relative">
                        <button 
                          onClick={() => setShowGlobalAdjTypeDropdown(showGlobalAdjTypeDropdown === 'global' ? null : 'global')}
                          className="bg-indigo-50 text-[11px] font-black text-indigo-700 outline-none px-4 py-2 rounded-xl pr-10 cursor-pointer hover:bg-indigo-100 transition-colors flex items-center gap-3 min-w-[140px] relative uppercase tracking-tight whitespace-nowrap"
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full shadow-sm shrink-0",
                            globalAdjustment.type === 'surcharge' ? "bg-rose-500" : "bg-emerald-500"
                          )} />
                          <span>{globalAdjustment.type === 'surcharge' ? 'Phụ thu' : 'Giảm giá'}</span>
                          <ChevronDown size={14} className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 transition-transform", showGlobalAdjTypeDropdown === 'global' && "rotate-180")} />
                        </button>
                        
                        <AnimatePresence>
                          {showGlobalAdjTypeDropdown === 'global' && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowGlobalAdjTypeDropdown(null)} />
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-2 w-48 bg-white shadow-2xl rounded-2xl border border-zinc-200 p-1.5 z-50"
                              >
                                <button 
                                  onClick={() => {
                                    setGlobalAdjustment({ ...globalAdjustment, type: 'surcharge' });
                                    setShowGlobalAdjTypeDropdown(null);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-3",
                                    globalAdjustment.type === 'surcharge' ? "bg-rose-50 text-rose-700" : "text-zinc-600 hover:bg-zinc-50"
                                  )}
                                >
                                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                                  Phụ thu
                                </button>
                                <button 
                                  onClick={() => {
                                    setGlobalAdjustment({ ...globalAdjustment, type: 'discount' });
                                    setShowGlobalAdjTypeDropdown(null);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-3",
                                    globalAdjustment.type === 'discount' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
                                  )}
                                >
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  Giảm giá
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                      <input 
                        type="number" 
                        value={globalAdjustment.amount === 0 ? '' : globalAdjustment.amount}
                        onChange={(e) => setGlobalAdjustment({ ...globalAdjustment, amount: e.target.value === '' ? 0 : Number(e.target.value) })}
                        className="w-full bg-transparent px-4 py-1 text-base font-black text-zinc-900 outline-none placeholder:text-zinc-300"
                        placeholder="0"
                      />
                      <button 
                        onClick={() => setGlobalAdjustment({ ...globalAdjustment, isPercentage: !globalAdjustment.isPercentage })}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm",
                          globalAdjustment.isPercentage ? "bg-indigo-600 text-white" : "bg-white text-zinc-400 border border-zinc-200"
                        )}
                      >
                        {globalAdjustment.isPercentage ? <Percent size={16} /> : <DollarSign size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Results (Total) */}
              <div className="lg:col-span-5 space-y-6">
                <section className="bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden">
                  <div className="p-8 bg-indigo-600 text-white">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Tổng tiền thanh toán</h2>
                        <div className="text-4xl font-black tracking-tight text-white">
                          {calculation ? formatCurrency(calculation.finalTotal) : '---'}
                        </div>
                      </div>
                      {calculation && (
                        <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm">
                          {calculation.nights.length} đêm
                        </div>
                      )}
                    </div>
                    
                    {calculation && (
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                        <div>
                          <div className="text-[10px] text-indigo-100 uppercase font-bold mb-1">Đặt cọc (50%)</div>
                          <div className="text-xl font-bold text-white">{formatCurrency(calculation.deposit)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-indigo-100 uppercase font-bold mb-1">Còn lại</div>
                          <div className="text-xl font-bold text-indigo-100">{formatCurrency(calculation.finalTotal - calculation.deposit)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    {calculation ? (
                      <>
                        <div className="space-y-3">
                          <button 
                            onClick={() => setShowNightlyDetails(!showNightlyDetails)}
                            className="w-full flex justify-between items-center text-sm group"
                          >
                            <span className="text-zinc-500 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                              Giá gốc ({calculation.nights.length} đêm)
                              <ChevronDown size={14} className={cn("transition-transform", showNightlyDetails && "rotate-180")} />
                            </span>
                            <span className="font-bold text-zinc-900">{formatCurrency(calculation.totalBase)}</span>
                          </button>

                          <AnimatePresence>
                            {showNightlyDetails && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-zinc-50 rounded-xl p-3 space-y-2 border border-zinc-100">
                                  {calculation.nights.map((night, idx) => {
                                    const hasAdjustment = night.adjustments.length > 0;
                                    const isSurcharge = night.adjustments.some(a => a.type === 'surcharge');
                                    const isDiscount = night.adjustments.some(a => a.type === 'discount');
                                    
                                    return (
                                      <div 
                                        key={idx} 
                                        className={cn(
                                          "flex justify-between items-center p-2 rounded-lg transition-all",
                                          hasAdjustment 
                                            ? isSurcharge 
                                              ? "bg-rose-50/50 border border-rose-100" 
                                              : "bg-emerald-50/50 border border-emerald-100"
                                            : "text-zinc-500"
                                        )}
                                      >
                                        <div className="flex flex-col">
                                          <span className={cn(
                                            "text-[10px] font-bold",
                                            hasAdjustment ? "text-zinc-900" : "text-zinc-500"
                                          )}>
                                            {format(parseISO(night.date), 'dd/MM')} ({night.isWeekend ? 'T6-T7' : 'CN-T5'})
                                          </span>
                                          {hasAdjustment && (
                                            <div className="flex gap-1 mt-0.5">
                                              {night.adjustments.map((adj, aIdx) => (
                                                <span key={aIdx} className={cn(
                                                  "text-[8px] px-1 rounded uppercase font-black",
                                                  adj.type === 'surcharge' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                                )}>
                                                  {adj.note || (adj.type === 'surcharge' ? 'Phụ thu' : 'Giảm giá')}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <div className={cn(
                                            "text-[10px] font-black",
                                            hasAdjustment ? "text-zinc-900" : "text-zinc-500"
                                          )}>
                                            {formatCurrency(night.finalPrice)}
                                          </div>
                                          {night.vatPerNight > 0 && (
                                            <div className="text-[8px] text-zinc-500">
                                              VAT: {formatCurrency(night.vatPerNight)}
                                            </div>
                                          )}
                                          {hasAdjustment && (
                                            <div className="text-[8px] text-zinc-400 line-through">
                                              {formatCurrency(night.basePrice)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {globalAdjustment.amount !== 0 && (
                            <div className={cn(
                              "flex justify-between text-sm p-3 rounded-xl",
                              globalAdjustment.type === 'surcharge' ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                            )}>
                              <span className="flex items-center gap-2">
                                <Tag size={14} />
                                <span>{globalAdjustment.type === 'surcharge' ? 'Phụ thu' : 'Giảm giá'} {globalAdjustment.isPercentage ? `${globalAdjustment.amount}%` : ''}</span>
                              </span>
                              <span className="font-bold">
                                {globalAdjustment.type === 'surcharge' ? '+' : '-'} {formatCurrency(calculation.globalAdjustmentValue)}
                              </span>
                            </div>
                          )}

                          {calculation.stayDiscount && (
                            <div className="flex justify-between text-sm p-3 rounded-xl bg-indigo-50 text-indigo-700">
                              <span className="flex items-center gap-2">
                                <Percent size={14} />
                                <span>{calculation.stayDiscount.name}</span>
                              </span>
                              <span className="font-bold">
                                - {formatCurrency(calculation.stayDiscountValue)}
                              </span>
                            </div>
                          )}

                          <div className="pt-4 border-t border-zinc-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={includeVAT} 
                                  onChange={(e) => setIncludeVAT(e.target.checked)}
                                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Bao gồm VAT
                              </label>
                              {includeVAT && (
                                <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1">
                                  <input 
                                    type="number" 
                                    value={vatRate === 0 ? '' : vatRate} 
                                    onChange={(e) => setVatRate(e.target.value === '' ? 0 : Number(e.target.value))}
                                    className="w-10 text-right text-sm bg-transparent outline-none font-bold text-indigo-600"
                                    placeholder="10"
                                  />
                                  <span className="text-sm text-zinc-500 font-bold">%</span>
                                </div>
                              )}
                            </div>
                            {includeVAT && (
                              <div className="flex justify-between text-sm text-zinc-600">
                                <span>Thuế VAT ({vatRate}%)</span>
                                <span className="font-bold">{formatCurrency(calculation.vatValue)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Calculator size={40} className="mx-auto text-zinc-200 mb-3" />
                        <p className="text-sm text-zinc-400">Vui lòng chọn đầy đủ thông tin để xem báo giá</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Comparison */}
              <div className="lg:col-span-7">
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
                        onClick={() => setShowCompareFilter(!showCompareFilter)}
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
                          <div className="fixed inset-0 z-40" onClick={() => setShowCompareFilter(false)} />
                          <div className="absolute top-full right-0 mt-2 w-72 z-50 bg-white shadow-2xl rounded-xl border border-zinc-200 p-2 origin-top-right">
                            <div className="flex p-1 bg-zinc-100 rounded-lg mb-2">
                              <button 
                                onClick={() => setFilterTab('branch')}
                                className={cn(
                                  "flex-1 py-1 text-[10px] font-bold rounded-md transition-all",
                                  filterTab === 'branch' ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                )}
                              >
                                Cơ sở
                              </button>
                              <button 
                                onClick={() => setFilterTab('room')}
                                className={cn(
                                  "flex-1 py-1 text-[10px] font-bold rounded-md transition-all",
                                  filterTab === 'room' ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                )}
                              >
                                Loại phòng
                              </button>
                            </div>

                            <div className="p-2 border-b border-zinc-100 mb-1 flex justify-between items-center">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                {filterTab === 'branch' ? 'Chọn cơ sở so sánh' : 'Chọn loại phòng so sánh'}
                              </span>
                              <button 
                                onClick={() => {
                                  if (filterTab === 'branch') {
                                    setCompareBranchIds(branches.map(b => b.id));
                                  } else {
                                    setCompareRoomIds(roomTypes.map(r => r.id));
                                  }
                                }}
                                className="text-[9px] text-indigo-600 font-bold hover:underline"
                              >
                                Tất cả
                              </button>
                            </div>

                            <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                              {filterTab === 'branch' ? (
                                branches.map(branch => (
                                  <button
                                    key={branch.id}
                                    onClick={() => {
                                      setCompareBranchIds(prev => 
                                        prev.includes(branch.id) 
                                          ? prev.filter(id => id !== branch.id)
                                          : [...prev, branch.id]
                                      );
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all",
                                      compareBranchIds.includes(branch.id) 
                                        ? "bg-indigo-50 text-indigo-700 font-semibold" 
                                        : "text-zinc-600 hover:bg-zinc-50"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {branch.name}
                                    </div>
                                    {compareBranchIds.includes(branch.id) && <Check size={12} />}
                                  </button>
                                ))
                              ) : (
                                roomTypes
                                  .filter(r => compareBranchIds.includes(r.branchId))
                                  .map(room => {
                                    const branch = branches.find(b => b.id === room.branchId);
                                    return (
                                      <button
                                        key={room.id}
                                        onClick={() => {
                                          setCompareRoomIds(prev => 
                                            prev.includes(room.id) 
                                              ? prev.filter(id => id !== room.id)
                                              : [...prev, room.id]
                                          );
                                        }}
                                        className={cn(
                                          "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all",
                                          compareRoomIds.includes(room.id) 
                                            ? "bg-indigo-50 text-indigo-700 font-semibold" 
                                            : "text-zinc-600 hover:bg-zinc-50"
                                        )}
                                      >
                                        <div className="flex-1 text-left">
                                          {room.name}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 font-normal mr-2">
                                          {branch?.name}
                                        </div>
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
                          onClick={() => {
                            setCompareBranchIds(branches.map(b => b.id));
                            setCompareRoomIds(roomTypes.map(r => r.id));
                          }}
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
                          <button 
                            key={room.id}
                            onClick={() => {
                              setSelectedBranchId(room.branchId);
                              setSelectedRoomId(room.id);
                            }}
                            className={cn(
                              "w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-all text-left group border-l-4",
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
                          </button>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-zinc-200 text-center">
        <p className="text-sm text-zinc-400">© 2026 Hotel Price Calculator. Built for efficiency.</p>
      </footer>
    </div>
  );
}
