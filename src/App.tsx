import { lazy, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { format, addDays, parseISO, getDay, isValid } from 'date-fns';
import { SurchargeBanner } from './components/SurchargeBanner';
import { BranchDropdown } from './components/BranchDropdown';
import { RoomDropdown } from './components/RoomDropdown';
import { DateRangePicker } from './components/DateRangePicker';
import { GlobalAdjustmentControl } from './components/GlobalAdjustmentControl';
import { PriceSummary } from './components/PriceSummary';
import { BookingSummary } from './components/BookingSummary';
import { ComparisonPanel } from './components/ComparisonPanel';
import { FetchErrorView } from './components/FetchErrorView';
import { useCalculateForRoom, useComparisons, useMultiRoomCalculator } from './components/useHotelCalculator';
import { Branch, RoomType, DateAdjustment, GlobalAdjustment, StayDiscount, EarlyCheckinLateCheckoutType, Item, SelectedRoomItem } from './components/types';
import { Hotel, Layers } from 'lucide-react';
import { FeatureBoundary, FeatureLoading } from './components/FeatureBoundary';
import { loadHotelData } from './lib/hotelData';

const loadItems = () => import('./components/ItemCompensation').then(module => ({ default: module.ItemCompensation }));
const loadMultiSelector = () => import('./components/MultiRoomSelector').then(module => ({ default: module.MultiRoomSelector }));
const loadMultiSummary = () => import('./components/MultiRoomSummary').then(module => ({ default: module.MultiRoomSummary }));
const ItemCompensation = lazy(loadItems);
const MultiRoomSelector = lazy(loadMultiSelector);
const MultiRoomSummary = lazy(loadMultiSummary);

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatCurrency = (amount: number) => currencyFormatter.format(amount);
const SESSION_STATE_KEY = 'hotel-price-calculator:session:v1';
const EARLY_LATE_OPTION_TYPES: EarlyCheckinLateCheckoutType[] = [
  'checkin_2200', 'early_0800', 'early_1230', 'early_1300', 'late_1300', 'late_1800',
];

interface PersistedSession {
  version: 1;
  activeTab: 'room' | 'items';
  roomMode: 'single' | 'multi';
  selectedBranchId: string;
  selectedRoomId: string;
  paidAmount?: number;
  checkIn: string;
  checkOut: string;
  globalAdjustment: GlobalAdjustment;
  includeVAT: boolean;
  vatRate: number;
  compareBranchIds: string[];
  compareRoomIds: string[];
  selectedEarlyLateOptions: EarlyCheckinLateCheckoutType[];
  multiRooms: Array<Omit<SelectedRoomItem, 'earlyLateOptions'> & { earlyLateOptions: EarlyCheckinLateCheckoutType[] }>;
  selectedQuantities: Record<string, number>;
  scrollY: number;
}

function readPersistedSession(): PersistedSession | null {
  try {
    const saved = sessionStorage.getItem(SESSION_STATE_KEY);
    if (!saved) return null;
    const value = JSON.parse(saved) as PersistedSession;
    return value?.version === 1 ? value : null;
  } catch {
    return null;
  }
}

function isValidStayDates(checkIn: unknown, checkOut: unknown): checkIn is string {
  if (typeof checkIn !== 'string' || typeof checkOut !== 'string') return false;
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  return /^\d{4}-\d{2}-\d{2}$/.test(checkIn)
    && /^\d{4}-\d{2}-\d{2}$/.test(checkOut)
    && isValid(start)
    && isValid(end)
    && checkOut > checkIn;
}

function restoreMultiRooms(
  savedRooms: PersistedSession['multiRooms'] | undefined,
  branches: Branch[],
  roomTypes: RoomType[],
  defaultCheckIn: string,
  defaultCheckOut: string,
): SelectedRoomItem[] {
  const source = Array.isArray(savedRooms) ? savedRooms.slice(0, 10) : [];
  const restored = source.flatMap((room, index) => {
    const branchId = branches.some(branch => branch.id === room?.branchId)
      ? room.branchId
      : branches[0]?.id;
    if (!branchId) return [];
    const branchRooms = roomTypes.filter(type => type.branchId === branchId);
    const roomId = branchRooms.some(type => type.id === room?.roomId)
      ? room.roomId
      : branchRooms[0]?.id;
    if (!roomId) return [];
    const checkIn = isValidStayDates(room?.checkIn, room?.checkOut) ? room.checkIn : defaultCheckIn;
    const checkOut = isValidStayDates(room?.checkIn, room?.checkOut) ? room.checkOut : defaultCheckOut;
    const options = new Set((Array.isArray(room?.earlyLateOptions) ? room.earlyLateOptions : [])
      .filter((option): option is EarlyCheckinLateCheckoutType => EARLY_LATE_OPTION_TYPES.includes(option)));
    const checkoutDate = parseISO(checkOut);
    if ((getDay(checkoutDate) === 5 || getDay(checkoutDate) === 6) && options.has('late_1800')) {
      options.delete('late_1800');
    }
    return [{
      id: typeof room?.id === 'string' && room.id ? room.id : `room-${index + 1}`,
      branchId,
      roomId,
      checkIn,
      checkOut,
      earlyLateOptions: options,
      ...(typeof room?.isIncluded === 'boolean' ? { isIncluded: room.isIncluded } : {}),
    }];
  });
  if (restored.length) return restored;
  const branchId = branches[0]?.id;
  const roomId = roomTypes.find(room => room.branchId === branchId)?.id;
  return branchId && roomId ? [{
    id: 'room-1', branchId, roomId, checkIn: defaultCheckIn, checkOut: defaultCheckOut, earlyLateOptions: new Set(),
  }] : [];
}

export default function App() {
  const [savedSession] = useState(readPersistedSession);
  const restoreScrollY = useRef<number | null>(savedSession?.scrollY ?? 0);
  const [roomReady, setRoomReady] = useState(false);
  const [itemsReady, setItemsReady] = useState(false);
  const requests = useRef<Partial<Record<'room' | 'items', Promise<void>>>>({});
  const [activeTab, setActiveTab] = useState<'room' | 'items'>(() => savedSession?.activeTab === 'items' ? 'items' : 'room');
  const [roomMode, setRoomMode] = useState<'single' | 'multi'>(() => savedSession?.roomMode === 'multi' ? 'multi' : 'single');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [stayDiscounts, setStayDiscounts] = useState<StayDiscount[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [comparisonRoomId, setComparisonRoomId] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState(() => Number.isSafeInteger(savedSession?.paidAmount) && (savedSession?.paidAmount ?? -1) >= 0 ? savedSession!.paidAmount! : 0);

  const [checkIn, setCheckIn] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState<string>(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'));
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
  const [roomLoading, setRoomLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [compareBranchIds, setCompareBranchIds] = useState<string[]>([]);
  const [compareRoomIds, setCompareRoomIds] = useState<string[]>([]);
  const [showCompareFilter, setShowCompareFilter] = useState(false);
  const [filterTab, setFilterTab] = useState<'branch' | 'room'>('branch');

  const [roomError, setRoomError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const loading = activeTab === 'room' ? roomLoading : itemsLoading;
  const fetchError = activeTab === 'room' ? roomError : itemsError;

  const [selectedEarlyLateOptions, setSelectedEarlyLateOptions] = useState<Set<EarlyCheckinLateCheckoutType>>(new Set());

  // Multi-room state
  const [multiRooms, setMultiRooms] = useState<SelectedRoomItem[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const snapshot: PersistedSession = {
      version: 1,
      activeTab,
      roomMode,
      selectedBranchId,
      selectedRoomId,
      paidAmount,
      checkIn,
      checkOut,
      globalAdjustment,
      includeVAT,
      vatRate,
      compareBranchIds,
      compareRoomIds,
      selectedEarlyLateOptions: [...selectedEarlyLateOptions],
      multiRooms: multiRooms.map(room => ({ ...room, earlyLateOptions: [...room.earlyLateOptions] })),
      selectedQuantities: itemsReady ? selectedQuantities : savedSession?.selectedQuantities ?? {},
      ...(!roomReady && savedSession ? {
        selectedBranchId: savedSession.selectedBranchId, selectedRoomId: savedSession.selectedRoomId,
        checkIn: savedSession.checkIn, checkOut: savedSession.checkOut,
        globalAdjustment: savedSession.globalAdjustment, includeVAT: savedSession.includeVAT,
        vatRate: savedSession.vatRate, compareBranchIds: savedSession.compareBranchIds,
        compareRoomIds: savedSession.compareRoomIds, selectedEarlyLateOptions: savedSession.selectedEarlyLateOptions,
        multiRooms: savedSession.multiRooms,
      } : {}),
      scrollY: restoreScrollY.current ?? window.scrollY,
    };
    try {
      sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(snapshot));
    } catch {
      // The app remains usable when browser storage is unavailable or full.
    }
  }, [
    roomReady, itemsReady, savedSession, activeTab, roomMode, selectedBranchId, selectedRoomId, checkIn, checkOut,
    globalAdjustment, includeVAT, vatRate, compareBranchIds, compareRoomIds, paidAmount,
    selectedEarlyLateOptions, multiRooms, selectedQuantities,
  ]);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    let frame = 0;
    const saveScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        try {
          const current = readPersistedSession();
          if (current) {
            sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify({ ...current, scrollY: window.scrollY }));
          }
        } catch {
          // Ignore storage failures; native page navigation is unaffected.
        }
      });
    };
    const saveScrollImmediately = () => {
      try {
        const current = readPersistedSession();
        if (current) sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify({ ...current, scrollY: window.scrollY }));
      } catch {
        // Ignore storage failures during page navigation.
      }
    };
    window.addEventListener('scroll', saveScroll, { passive: true });
    window.addEventListener('pagehide', saveScrollImmediately);
    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener('scroll', saveScroll);
      window.removeEventListener('pagehide', saveScrollImmediately);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const restoreScroll = useCallback(() => {
    const target = restoreScrollY.current;
    if (target === null) return;
    restoreScrollY.current = null;
    window.scrollTo(0, target);
  }, []);

  const onChangeQuantity = useCallback((id: string, quantity: number) => {
    setSelectedQuantities(prev => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: quantity };
    });
  }, []);

  const toggleEarlyLateOption = useCallback((type: EarlyCheckinLateCheckoutType) => {
    if (type === 'late_1800') {
      const coDate = parseISO(checkOut);
      if (isValid(coDate) && (getDay(coDate) === 5 || getDay(coDate) === 6)) {
        return; // Không cho phép tick checkout trễ 18:00 vào Thứ 6, Thứ 7
      }
    }
    setSelectedEarlyLateOptions(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        if (type === 'checkin_2200') {
          next.delete('early_0800');
          next.delete('early_1230');
          next.delete('early_1300');
        } else if (type.startsWith('early_')) {
          next.delete('checkin_2200');
        }
        next.add(type);
      }
      return next;
    });
  }, [checkOut]);

  // Tự động bỏ chọn late_1800 nếu ngày check-out rơi vào Thứ 6 hoặc Thứ 7
  useEffect(() => {
    if (!checkOut) return;
    const coDate = parseISO(checkOut);
    if (isValid(coDate) && (getDay(coDate) === 5 || getDay(coDate) === 6)) {
      setSelectedEarlyLateOptions(prev => {
        if (prev.has('late_1800')) {
          const next = new Set(prev);
          next.delete('late_1800');
          return next;
        }
        return prev;
      });
    }
  }, [checkOut]);

  const fetchData = useCallback((scope: 'room' | 'items'): Promise<void> => {
    const pending = requests.current[scope];
    if (pending) return pending;
    const setGroupLoading = scope === 'room' ? setRoomLoading : setItemsLoading;
    const setGroupError = scope === 'room' ? setRoomError : setItemsError;
    setGroupLoading(true);
    setGroupError(null);
    const request = (async () => {
      try {
        const hotelData = await loadHotelData(scope);
        if (scope === 'room') {
          const { branches: bData, roomTypes: rData, stayDiscounts: dData, dateAdjustments: aData } = hotelData as {
            branches: Branch[]; roomTypes: RoomType[]; stayDiscounts: StayDiscount[]; dateAdjustments: DateAdjustment[];
          };
          setBranches(bData);
          setRoomTypes(rData);
          setStayDiscounts(dData);
          setDateAdjustments(aData);
          if (bData.length > 0) {
            const restore = savedSession;
            const defaultBranchId = bData[0].id;
            const selectedBranch = restore && bData.some(branch => branch.id === restore.selectedBranchId)
              ? restore.selectedBranchId
              : defaultBranchId;
            const defaultBranchRooms = rData.filter(room => room.branchId === selectedBranch);
            const selectedRoom = restore && defaultBranchRooms.some(room => room.id === restore.selectedRoomId)
              ? restore.selectedRoomId
              : defaultBranchRooms[0]?.id || '';
            const defaultCheckIn = format(new Date(), 'yyyy-MM-dd');
            const defaultCheckOut = format(addDays(new Date(), 1), 'yyyy-MM-dd');
            const validSavedStay = isValidStayDates(restore?.checkIn, restore?.checkOut);
            const restoredCheckIn = validSavedStay && restore ? restore.checkIn : defaultCheckIn;
            const restoredCheckOut = validSavedStay && restore ? restore.checkOut : defaultCheckOut;
            const restoredAdjustment = restore?.globalAdjustment;
            const validAdjustment = restoredAdjustment
              && (restoredAdjustment.type === 'surcharge' || restoredAdjustment.type === 'discount')
              && Number.isFinite(restoredAdjustment.amount)
              && restoredAdjustment.amount >= 0
              && typeof restoredAdjustment.isPercentage === 'boolean';

            setSelectedBranchId(selectedBranch);
            setSelectedRoomId(selectedRoom);
            setCheckIn(restoredCheckIn);
            setCheckOut(restoredCheckOut);
            const legacyGoogleReviews = (restoredAdjustment as (GlobalAdjustment & { preset?: string }) | undefined)?.preset === 'google_reviews';
            setGlobalAdjustment(legacyGoogleReviews
              ? { type: 'discount', amount: 0, isPercentage: true, googleReviews: true }
              : validAdjustment ? restoredAdjustment : { type: 'surcharge', amount: 0, isPercentage: true });
            setIncludeVAT(typeof restore?.includeVAT === 'boolean' ? restore.includeVAT : false);
            setVatRate(restore && Number.isFinite(restore.vatRate) && restore.vatRate >= 0 && restore.vatRate <= 100
              ? restore.vatRate
              : 10);
            setCompareBranchIds(Array.isArray(restore?.compareBranchIds)
              ? restore.compareBranchIds.filter(id => bData.some(branch => branch.id === id))
              : bData.map(branch => branch.id));
            setCompareRoomIds(Array.isArray(restore?.compareRoomIds)
              ? restore.compareRoomIds.filter(id => rData.some(room => room.id === id))
              : rData.map(room => room.id));
            const restoredOptions = new Set((Array.isArray(restore?.selectedEarlyLateOptions) ? restore.selectedEarlyLateOptions : [])
              .filter((option): option is EarlyCheckinLateCheckoutType => EARLY_LATE_OPTION_TYPES.includes(option)));
            const checkOutDay = getDay(parseISO(restoredCheckOut));
            if ((checkOutDay === 5 || checkOutDay === 6) && restoredOptions.has('late_1800')) restoredOptions.delete('late_1800');
            if (restoredOptions.has('checkin_2200')) {
              restoredOptions.delete('early_0800');
              restoredOptions.delete('early_1230');
              restoredOptions.delete('early_1300');
            }
            setSelectedEarlyLateOptions(restoredOptions);
            setMultiRooms(restoreMultiRooms(restore?.multiRooms, bData, rData, defaultCheckIn, defaultCheckOut));
          }
          setRoomReady(true);
        } else {
          const iDataMapped = hotelData.items as Item[];
          setItems(iDataMapped);
          const restore = savedSession;
          const currentItemIds = new Map(iDataMapped.map(item => [item.id, item.quantity]));
          const quantities: Record<string, number> = {};
          if (restore?.selectedQuantities && typeof restore.selectedQuantities === 'object') {
            for (const [id, quantity] of Object.entries(restore.selectedQuantities)) {
              const available = currentItemIds.get(id);
              if (available !== undefined && Number.isInteger(quantity) && quantity > 0 && available > 0) {
                quantities[id] = Math.min(quantity, available);
              }
            }
          }
          setSelectedQuantities(quantities);
          setItemsReady(true);
        }
      } catch (error) {
        setGroupError(error instanceof Error ? error.message : 'Không tải được dữ liệu từ Supabase.');
      } finally {
        setGroupLoading(false);
      }
    })();
    requests.current[scope] = request;
    void request.finally(() => { delete requests.current[scope]; });
    return request;
  }, [savedSession]);

  useEffect(() => {
    if (activeTab === 'room' ? !roomReady && !roomError : !itemsReady && !itemsError) void fetchData(activeTab);
  }, [activeTab, roomReady, itemsReady, roomError, itemsError, fetchData]);

  useEffect(() => {
    // Fetch feature code alongside its data, with rendering errors handled by the boundary.
    if (activeTab === 'items') void loadItems().catch(() => {});
    else if (roomMode === 'multi') {
      void loadMultiSelector().catch(() => {});
      void loadMultiSummary().catch(() => {});
    }
  }, [activeTab, roomMode]);

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

  // Single room calculation
  const calculation = useCalculateForRoom(selectedRoom, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, selectedEarlyLateOptions);

  const comparisons = useComparisons(roomTypes, branches, compareBranchIds, compareRoomIds, selectedRoom, calculation, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, selectedEarlyLateOptions);
  const comparisonRoom = roomTypes.find(room => room.id === comparisonRoomId);
  const comparisonCalculation = useCalculateForRoom(comparisonRoom, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, selectedEarlyLateOptions);
  const comparisonDifference = comparisonRoom && comparisonRoom.id !== selectedRoomId && comparisonCalculation && calculation
    ? comparisonCalculation.finalTotal - calculation.finalTotal : 0;
  const comparisonVatDifference = comparisonRoom && comparisonRoom.id !== selectedRoomId && comparisonCalculation && calculation
    ? comparisonCalculation.vatValue - calculation.vatValue : 0;
  const comparisonName = comparisonRoom && comparisonRoom.id !== selectedRoomId ? `${comparisonRoom.name} (${branches.find(branch => branch.id === comparisonRoom.branchId)?.name || ''})` : '';
  useEffect(() => { setComparisonRoomId(null); }, [selectedBranchId, selectedRoomId]);

  // Multi-room calculation
  const multiRoomSummary = useMultiRoomCalculator(multiRooms, roomTypes, branches, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate);

  // Multi-room handlers
  const handleAddMultiRoom = useCallback(() => {
    if (multiRooms.length >= 10) return;
    const lastRoom = multiRooms[multiRooms.length - 1];
    const defaultBranchId = lastRoom?.branchId || branches[0]?.id || '';
    const availableRooms = roomTypes.filter(r => r.branchId === defaultBranchId);
    const defaultRoomId = availableRooms[0]?.id || '';

    setMultiRooms(prev => [
      ...prev,
      {
        id: `room-${Date.now()}-${Math.random()}`,
        branchId: defaultBranchId,
        roomId: defaultRoomId,
        checkIn: lastRoom?.checkIn || format(new Date(), 'yyyy-MM-dd'),
        checkOut: lastRoom?.checkOut || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        earlyLateOptions: new Set()
      }
    ]);
  }, [multiRooms, branches, roomTypes]);

  const handleDuplicateMultiRoom = useCallback((index: number) => {
    if (multiRooms.length >= 10) return;
    const target = multiRooms[index];
    if (!target) return;

    setMultiRooms(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, {
        ...target,
        id: `room-${Date.now()}-${Math.random()}`,
        earlyLateOptions: new Set(target.earlyLateOptions)
      });
      return copy;
    });
  }, [multiRooms]);

  const handleRemoveMultiRoom = useCallback((index: number) => {
    if (multiRooms.length <= 1) return;
    setMultiRooms(prev => prev.filter((_, i) => i !== index));
  }, [multiRooms.length]);

  const handleUpdateMultiRoom = useCallback((index: number, updates: Partial<SelectedRoomItem>) => {
    setMultiRooms(prev => {
      const copy = [...prev];
      const current = copy[index];
      if (!current) return prev;
      const updated = { ...current, ...updates };
      // Nếu checkOut thay đổi sang Thứ 6 hoặc Thứ 7, tự động loại bỏ late_1800
      if (updated.checkOut && updated.earlyLateOptions?.has('late_1800')) {
        const coDate = parseISO(updated.checkOut);
        if (isValid(coDate) && (getDay(coDate) === 5 || getDay(coDate) === 6)) {
          const nextSet = new Set(updated.earlyLateOptions);
          nextSet.delete('late_1800');
          updated.earlyLateOptions = nextSet;
        }
      }
      copy[index] = updated;
      return copy;
    });
  }, []);

  const handleToggleMultiEarlyLate = useCallback((index: number, type: EarlyCheckinLateCheckoutType) => {
    setMultiRooms(prev => {
      const copy = [...prev];
      const target = copy[index];
      if (!target) return prev;
      // Không cho phép chọn late_1800 nếu ngày check-out là Thứ 6 hoặc Thứ 7
      if (type === 'late_1800' && target.checkOut) {
        const coDate = parseISO(target.checkOut);
        if (isValid(coDate) && (getDay(coDate) === 5 || getDay(coDate) === 6)) {
          return prev;
        }
      }
      const nextSet = new Set(target.earlyLateOptions);
      if (nextSet.has(type)) {
        nextSet.delete(type);
      } else {
        if (type === 'checkin_2200') {
          nextSet.delete('early_0800');
          nextSet.delete('early_1230');
          nextSet.delete('early_1300');
        } else if (type.startsWith('early_')) {
          nextSet.delete('checkin_2200');
        }
        nextSet.add(type);
      }
      copy[index] = { ...target, earlyLateOptions: nextSet };
      return copy;
    });
  }, []);

  return (
    <div className="min-h-dvh pb-16 bg-slate-50 text-slate-900">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand & Wordmark */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900">
                  SIRIS RESIDENCES
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 uppercase">
                  Nội bộ
                </span>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('room')}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'room'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tính tiền phòng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('items')}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'items'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bồi thường vật dụng
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Subheader: Room Mode Switcher */}
        {activeTab === 'room' && (
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {roomMode === 'single' ? 'Báo giá phòng đơn' : 'Báo giá nhiều phòng'}
              </h1>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setRoomMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  roomMode === 'single'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Hotel size={14} />
                <span>Phòng đơn</span>
              </button>
              <button
                type="button"
                onClick={() => setRoomMode('multi')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  roomMode === 'multi'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Layers size={14} />
                <span>Nhiều phòng</span>
                {multiRooms.length > 1 && (
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    roomMode === 'multi' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                  }`}>
                    {multiRooms.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {fetchError ? (
          <FetchErrorView message={fetchError} onRetry={() => void fetchData(activeTab)} />
        ) : loading ? (
          <FeatureLoading />
        ) : (
          <FeatureBoundary key={activeTab} onReady={restoreScroll}>
            {activeTab === 'room' ? (
              <>
                <SurchargeBanner adjustments={dateAdjustments} />

                {roomMode === 'single' ? (
                  /* Single Room Mode UI */
                  <div className="space-y-5 sm:space-y-6">
                    {/* Top Configuration Console */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible relative z-30">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        <BranchDropdown
                          branches={branches}
                          selectedBranchId={selectedBranchId}
                          showDropdown={showBranchDropdown}
                          onToggle={() => setShowBranchDropdown(!showBranchDropdown)}
                          onSelect={(id) => {
                            setSelectedBranchId(id);
                            const available = roomTypes.filter((r) => r.branchId === id);
                            if (available.length > 0) {
                              setSelectedRoomId(available[0].id);
                            } else {
                              setSelectedRoomId('');
                            }
                          }}
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
                          includeVAT={includeVAT}
                          vatRate={vatRate}
                          onToggleVAT={setIncludeVAT}
                          onVatRateChange={setVatRate}
                          showDropdown={showGlobalAdjTypeDropdown}
                          onToggleDropdown={() => setShowGlobalAdjTypeDropdown(!showGlobalAdjTypeDropdown)}
                          onCloseDropdown={() => setShowGlobalAdjTypeDropdown(false)}
                          onTypeChange={(type) => setGlobalAdjustment({ ...globalAdjustment, type })}
                          onAmountChange={(amount) => setGlobalAdjustment({ ...globalAdjustment, amount })}
                          onTogglePercentage={() =>
                            setGlobalAdjustment({ ...globalAdjustment, isPercentage: !globalAdjustment.isPercentage })
                          }
                        />
                      </div>
                    </section>

                    {/* Dual Column Layout: Price Quote (Left) & Comparisons + Quote Assistant (Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                      <div className="lg:col-span-5">
                        <PriceSummary
                          calculation={calculation}
                          comparisonDifference={comparisonDifference}
                          comparisonVatDifference={comparisonVatDifference}
                          mobileBookingSummary={<BookingSummary
                          calculation={calculation}
                          comparisonDifference={comparisonDifference}
                          comparisonVatDifference={comparisonVatDifference}
                          comparisonBranchName={branches.find(branch => branch.id === comparisonRoom?.branchId)?.name || ''}
                          comparisonRoomName={comparisonRoom?.name || ''}
                          comparisonName={comparisonName}
                          paidAmount={paidAmount}
                          globalAdjustment={globalAdjustment}
                          selectedEarlyLateOptions={selectedEarlyLateOptions}
                          checkIn={checkIn}
                          checkOut={checkOut}
                          branchName={branches.find((branch) => branch.id === selectedBranchId)?.name || ''}
                          roomName={selectedRoom?.name || ''}
                          formatCurrency={formatCurrency}
                        />}
                          comparisonName={comparisonName}
                          originalRoomName={`${selectedRoom?.name || ''} (${branches.find((branch) => branch.id === selectedBranchId)?.name || ''})`}
                          paidAmount={paidAmount}
                          onPaidAmountChange={setPaidAmount}
                          globalAdjustment={globalAdjustment}
                          onToggleGoogleReviews={(checked) =>
                            setGlobalAdjustment((prev) => ({ ...prev, googleReviews: checked }))
                          }
                          showNightlyDetails={showNightlyDetails}
                          onToggleNightlyDetails={() => setShowNightlyDetails(!showNightlyDetails)}
                          formatCurrency={formatCurrency}
                          selectedEarlyLateOptions={selectedEarlyLateOptions}
                          onToggleEarlyLateOption={toggleEarlyLateOption}
                          checkOut={checkOut}
                        />
                      </div>
                      <div className="lg:col-span-7 space-y-5">
                        <div className="hidden lg:block">
                        <BookingSummary
                          calculation={calculation}
                          comparisonDifference={comparisonDifference}
                          comparisonVatDifference={comparisonVatDifference}
                          comparisonBranchName={branches.find(branch => branch.id === comparisonRoom?.branchId)?.name || ''}
                          comparisonRoomName={comparisonRoom?.name || ''}
                          comparisonName={comparisonName}
                          paidAmount={paidAmount}
                          globalAdjustment={globalAdjustment}
                          selectedEarlyLateOptions={selectedEarlyLateOptions}
                          checkIn={checkIn}
                          checkOut={checkOut}
                          branchName={branches.find((branch) => branch.id === selectedBranchId)?.name || ''}
                          roomName={selectedRoom?.name || ''}
                          formatCurrency={formatCurrency}
                        />
                        </div>
                        <ComparisonPanel
                          comparisons={comparisons}
                          branches={branches}
                          roomTypes={roomTypes}
                          compareBranchIds={compareBranchIds}
                          compareRoomIds={compareRoomIds}
                          showCompareFilter={showCompareFilter}
                          filterTab={filterTab}
                          selectedRoomId={comparisonRoomId || selectedRoomId}
                          onToggleFilter={() => setShowCompareFilter(!showCompareFilter)}
                          onCloseFilter={() => setShowCompareFilter(false)}
                          onSetFilterTab={(tab) => setFilterTab(tab)}
                          onToggleBranchFilter={(id) =>
                            setCompareBranchIds((prev) =>
                              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                            )
                          }
                          onToggleRoomFilter={(id) =>
                            setCompareRoomIds((prev) =>
                              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                            )
                          }
                          onSelectAll={(tab) => {
                            if (tab === 'branch') setCompareBranchIds(branches.map((b) => b.id));
                            else setCompareRoomIds(roomTypes.map((r) => r.id));
                          }}
                          onDeselectAll={(tab) => {
                            if (tab === 'branch') setCompareBranchIds([]);
                            else setCompareRoomIds([]);
                          }}
                          onSelectRoom={(_branchId, roomId) =>
                            setComparisonRoomId((current) =>
                              roomId === selectedRoomId || roomId === current ? null : roomId
                            )
                          }
                          formatCurrency={formatCurrency}
                        />


                      </div>
                    </div>
                  </div>
                ) : (
                  /* Multi-Room Mode UI */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                      <div className="lg:col-span-7 space-y-4">
                        <MultiRoomSelector
                          rooms={multiRooms}
                          branches={branches}
                          roomTypes={roomTypes}
                          summary={multiRoomSummary}
                          onAddRoom={handleAddMultiRoom}
                          onDuplicateRoom={handleDuplicateMultiRoom}
                          onRemoveRoom={handleRemoveMultiRoom}
                          onUpdateRoom={handleUpdateMultiRoom}
                          onToggleEarlyLate={handleToggleMultiEarlyLate}
                          formatCurrency={formatCurrency}
                        />
                      </div>

                      <div className="lg:col-span-5 space-y-4 sticky top-20">
                        {/* Global adjustment control in multi-room mode */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 relative z-30">
                          <GlobalAdjustmentControl
                            globalAdjustment={globalAdjustment}
                            includeVAT={includeVAT}
                            vatRate={vatRate}
                            onToggleVAT={setIncludeVAT}
                            onVatRateChange={setVatRate}
                            showDropdown={showGlobalAdjTypeDropdown}
                            onToggleDropdown={() => setShowGlobalAdjTypeDropdown(!showGlobalAdjTypeDropdown)}
                            onCloseDropdown={() => setShowGlobalAdjTypeDropdown(false)}
                            onTypeChange={(type) => setGlobalAdjustment({ ...globalAdjustment, type })}
                            onAmountChange={(amount) => setGlobalAdjustment({ ...globalAdjustment, amount })}
                            onTogglePercentage={() =>
                              setGlobalAdjustment({ ...globalAdjustment, isPercentage: !globalAdjustment.isPercentage })
                            }
                          />
                        </div>

                        <MultiRoomSummary
                          summary={multiRoomSummary}
                          globalAdjustment={globalAdjustment}
                          onToggleGoogleReviews={(checked) =>
                            setGlobalAdjustment((prev) => ({ ...prev, googleReviews: checked }))
                          }
                          includeVAT={includeVAT}
                          vatRate={vatRate}
                          onToggleIncludeRoom={(index) => {
                            handleUpdateMultiRoom(index, {
                              isIncluded: multiRooms[index]?.isIncluded === false ? true : false,
                            });
                          }}
                          formatCurrency={formatCurrency}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="max-w-[1600px] mx-auto">
                <ItemCompensation
                  items={items}
                  selectedQuantities={selectedQuantities}
                  onChangeQuantity={onChangeQuantity}
                  formatCurrency={formatCurrency}
                />
              </div>
            )}
          </FeatureBoundary>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-slate-400">
        <p>© 2026 Siris Residences</p>
      </footer>
    </div>
  );
}
