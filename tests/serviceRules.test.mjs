import test from 'node:test';
import assert from 'node:assert/strict';
import { serviceAvailable, serviceAmount, normalizeServiceSelection, toggleServiceSelection } from '../src/lib/serviceRules.ts';

const base = { id: '1', code: 'early_0900', name: 'Early', description: null, category: 'early_checkin', amountType: 'percentage', amount: 50, calculationBase: 'previous_night', timeFrom: null, timeTo: null, excludedWeekdays: [], exclusiveGroup: null, isActive: true, sortOrder: 0 };
const prices = { previousNight: 480000, nextNight: 440000, firstNight: 400000, subtotal: 920000 };

test('calculates fixed and all percentage bases', () => {
  assert.equal(serviceAmount({ ...base, amountType: 'fixed', amount: 150000 }, prices), 150000);
  for (const [calculationBase, expected] of [['previous_night', 240000], ['next_night', 220000], ['first_night', 200000], ['subtotal', 460000]]) assert.equal(serviceAmount({ ...base, calculationBase }, prices), expected);
});

test('excludes weekdays based on the service category', () => {
  const early = { ...base, excludedWeekdays: [4] };
  const late = { ...early, category: 'late_checkout', excludedWeekdays: [6] };
  assert.equal(serviceAvailable(early, '2030-01-03', '2030-01-05'), false);
  assert.equal(serviceAvailable(late, '2030-01-03', '2030-01-05'), false);
  assert.equal(serviceAvailable({ ...early, isActive: false }, '2030-01-03', '2030-01-05'), false);
});

test('restores legacy 08:00 code, discards unavailable rules and enforces groups', () => {
  const other = { ...base, id: '2', code: 'early_1230', exclusiveGroup: 'arrival' };
  const first = { ...base, exclusiveGroup: 'arrival' };
  assert.deepEqual([...normalizeServiceSelection(['early_0800', 'early_1230', 'missing'], [first, other], '2030-01-03', '2030-01-05')], ['early_0900']);
  assert.deepEqual([...toggleServiceSelection(new Set(['early_0900']), 'early_1230', [first, other], '2030-01-03', '2030-01-05')], ['early_1230']);
  const late = { ...base, code: 'checkin_2200', category: 'other', amount: -20, calculationBase: 'first_night' };
  assert.deepEqual([...toggleServiceSelection(new Set(['early_0900']), 'checkin_2200', [first, other, late], '2030-01-03', '2030-01-05')], ['checkin_2200']);
});

test('allocates service fees evenly across nights without losing đồng', async () => {
  const { allocateServiceCharge } = await import('../src/lib/serviceRules.ts');
  assert.deepEqual(allocateServiceCharge(100001, 3), [33334, 33334, 33333]);
  assert.deepEqual(allocateServiceCharge(-5, 2), [-3, -2]);
  assert.deepEqual(allocateServiceCharge(100, 0), []);
});

test('service fees are excluded from stay promotions', async () => {
  const { calculateForRoomLogic } = await import('../src/lib/hotelCalculator.ts');
  const room = { id: 'r', branchId: 'b', name: 'Room', weekdayPrice: 440000, weekendPrice: 480000 };
  const service = { ...base, code: 'fee', amountType: 'fixed', amount: 150000, calculationBase: null };
  const promo = { id: 'p', name: 'Promotion', minNights: 1, discountAmount: 10, isPercentage: true, branchId: null, roomTypeId: null, stayStart: '2030-01-04', stayEnd: '2030-01-04', discountBasis: 'per_stay', maxDiscountPerNight: null, maxDiscountPerStay: null, priority: 0, isActive: true };
  const calc = promotion => calculateForRoomLogic(room, '2030-01-03', '2030-01-05', [], { type: 'discount', amount: 0, isPercentage: false, serviceRules: [service] }, [promotion], true, 10, new Set(['fee']));
  const stay = calc(promo);
  assert.equal(stay.earlyLateTotal, 150000);
  assert.equal(stay.stayDiscountValue, 48000);
  assert.equal(stay.finalTotal, 1124200);
  const nightly = calc({ ...promo, discountBasis: 'per_night' });
  assert.equal(nightly.stayDiscountValue, 48000);
  const capped = calc({ ...promo, discountAmount: 20, maxDiscountPerNight: 50000 });
  assert.equal(capped.stayDiscountValue, 50000);
});

test('multiple rooms calculate their own fees before promotions and apply VAT once', async () => {
  const { calculateMultiRoomLogic } = await import('../src/lib/hotelCalculator.ts');
  const room = { id: 'r', branchId: 'b', name: 'Room', weekdayPrice: 440000, weekendPrice: 480000 };
  const service = { ...base, code: 'fee', amountType: 'fixed', amount: 150000, calculationBase: null };
  const promo = { id: 'p', name: 'Promotion', minNights: 1, discountAmount: 10, isPercentage: true, branchId: null, roomTypeId: null, stayStart: null, stayEnd: null, discountBasis: 'per_stay', maxDiscountPerNight: null, maxDiscountPerStay: null, priority: 0, isActive: true };
  const item = { id: '1', roomId: 'r', branchId: 'b', checkIn: '2030-01-03', checkOut: '2030-01-05', earlyLateOptions: new Set(['fee']) };
  const total = calculateMultiRoomLogic([item, { ...item, id: '2' }], [room], [{ id: 'b', name: 'B' }], [], { type: 'discount', amount: 0, isPercentage: false, serviceRules: [service] }, [promo], true, 10);
  assert.equal(total.totalEarlyLate, 300000);
  assert.equal(total.totalStayDiscounts, 184000);
  assert.equal(total.finalTotal, 2151600);
  assert.equal(total.deposit, 1075800);
});

test('weekdays use ISO numbers with Monday 1 and Sunday 7', () => {
  assert.equal(serviceAvailable({ ...base, excludedWeekdays: [1] }, '2030-01-07', '2030-01-08'), false);
  assert.equal(serviceAvailable({ ...base, excludedWeekdays: [7] }, '2030-01-06', '2030-01-07'), false);
  assert.equal(serviceAvailable({ ...base, excludedWeekdays: [5, 6] }, '2030-01-04', '2030-01-05'), false);
});

test('22:00 discount uses the percentage stored in the service rule exactly once', async () => {
  const { calculateForRoomLogic } = await import('../src/lib/hotelCalculator.ts');
  const room = { id: 'r', branchId: 'b', name: 'Room', weekdayPrice: 440000, weekendPrice: 480000 };
  const late = { ...base, code: 'checkin_2200', name: 'Check-in 22:00', category: 'other', amount: -20, calculationBase: 'first_night' };
  const result = calculateForRoomLogic(room, '2030-01-03', '2030-01-05', [], { type: 'discount', amount: 0, isPercentage: false, serviceRules: [late] }, [], false, 10, new Set(['checkin_2200']));
  assert.equal(result.earlyLateTotal, -88000);
  assert.equal(result.finalTotal, 832000);
  assert.deepEqual(result.serviceDetails, [{ label: 'Check-in 22:00', amount: -88000 }]);
});

test('manual promotion excludes service fees even with VAT', async () => {
  const { calculateForRoomLogic } = await import('../src/lib/hotelCalculator.ts');
  const room = { id: 'r', branchId: 'b', name: 'Room', weekdayPrice: 440000, weekendPrice: 480000 };
  const fee = { ...base, code: 'fee', amountType: 'fixed', amount: 150000, calculationBase: null };
  const manual = { id: 'p', name: 'Manual', minNights: 1, discountAmount: 10, isPercentage: true, branchId: null, roomTypeId: null, stayStart: null, stayEnd: null, discountBasis: 'per_stay', maxDiscountPerNight: null, maxDiscountPerStay: null, priority: 0, isActive: true, selectionMode: 'manual' };
  const result = calculateForRoomLogic(room, '2030-01-03', '2030-01-05', [], { type: 'discount', amount: 0, isPercentage: false, serviceRules: [fee], selectedPromotionIds: ['p'] }, [manual], true, 10, new Set(['fee']));
  assert.equal(result.manualDiscounts[0].amount, 92000);
  assert.equal(result.finalTotal, 1075800);
});

test('promotion_calcuate includes only opted-in services for automatic promotions', async () => {
  const { calculateForRoomLogic } = await import('../src/lib/hotelCalculator.ts');
  const room = { id: 'r', branchId: 'b', name: 'Room', weekdayPrice: 440000, weekendPrice: 480000 };
  const fee = { ...base, code: 'fee', amountType: 'fixed', amount: 100000, calculationBase: null, promotionCalcuate: true };
  const excluded = { ...fee, code: 'excluded', amount: 50000, promotionCalcuate: false };
  const promo = { id: 'p', name: 'Promotion', minNights: 1, discountAmount: 10, isPercentage: true, branchId: null, roomTypeId: null, stayStart: '2030-01-04', stayEnd: '2030-01-04', discountBasis: 'per_night', maxDiscountPerNight: null, maxDiscountPerStay: null, priority: 0, isActive: true };
  for (const basis of ['per_night', 'per_stay']) {
    const result = calculateForRoomLogic(room, '2030-01-03', '2030-01-05', [], { type: 'discount', amount: 0, isPercentage: false, serviceRules: [fee, excluded] }, [{ ...promo, discountBasis: basis }], false, 10, new Set(['fee', 'excluded']));
    assert.equal(result.earlyLateTotal, 150000);
    assert.equal(result.stayDiscountValue, 53000);
    assert.equal(result.finalTotal, 1017000);
  }
});

test('manual promotion applies the flag and caps once across rooms', async () => {
  const { calculateMultiRoomLogic } = await import('../src/lib/hotelCalculator.ts');
  const room = { id: 'r', branchId: 'b', name: 'Room', weekdayPrice: 440000, weekendPrice: 480000 };
  const fee = { ...base, code: 'fee', amountType: 'fixed', amount: 100000, calculationBase: null, promotionCalcuate: true };
  const promo = { id: 'p', name: 'Manual', minNights: 1, discountAmount: 10, isPercentage: true, branchId: null, roomTypeId: null, stayStart: null, stayEnd: null, discountBasis: 'per_stay', maxDiscountPerNight: null, maxDiscountPerStay: 70000, priority: 0, isActive: true, selectionMode: 'manual' };
  const item = { id: '1', roomId: 'r', branchId: 'b', checkIn: '2030-01-03', checkOut: '2030-01-04', earlyLateOptions: new Set(['fee']) };
  const result = calculateMultiRoomLogic([item, { ...item, id: '2' }], [room], [{ id: 'b', name: 'B' }], [], { type: 'discount', amount: 0, isPercentage: false, serviceRules: [fee], selectedPromotionIds: ['p'] }, [promo], false, 10);
  assert.equal(result.manualDiscounts[0].amount, 70000);
  assert.equal(result.finalTotal, 1010000);
});

test('negative opted-in service reduces the promotion base', async () => {
  const { calculateForRoomLogic } = await import('../src/lib/hotelCalculator.ts');
  const room = { id: 'r', branchId: 'b', name: 'Room', weekdayPrice: 440000, weekendPrice: 480000 };
  const fee = { ...base, code: 'checkin_2200', category: 'other', amount: -20, calculationBase: 'first_night', promotionCalcuate: true };
  const promo = { id: 'p', name: 'Promotion', minNights: 1, discountAmount: 10, isPercentage: true, branchId: null, roomTypeId: null, stayStart: null, stayEnd: null, discountBasis: 'per_stay', maxDiscountPerNight: null, maxDiscountPerStay: null, priority: 0, isActive: true };
  const result = calculateForRoomLogic(room, '2030-01-03', '2030-01-04', [], { type: 'discount', amount: 0, isPercentage: false, serviceRules: [fee] }, [promo], false, 10, new Set(['checkin_2200']));
  assert.equal(result.earlyLateTotal, -88000);
  assert.equal(result.stayDiscountValue, 35200);
  assert.equal(result.finalTotal, 316800);
});
