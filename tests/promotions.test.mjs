import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateForRoomLogic, calculateMultiRoomLogic } from '../src/lib/hotelCalculator.ts';
import { getPriceBreakdown } from '../src/lib/priceBreakdown.ts';

const room = { id: 'r1', branchId: 'b1', name: 'Standard', weekdayPrice: 440000, weekendPrice: 480000 };
const adjustment = { type: 'discount', amount: 0, isPercentage: false };
const rule = (changes = {}) => ({ id: 'p1', name: 'Ưu đãi', minNights: 1, discountAmount: 10, isPercentage: true, branchId: null, roomTypeId: null, stayStart: null, stayEnd: null, discountBasis: 'per_night', maxDiscountPerNight: null, maxDiscountPerStay: null, priority: 0, isActive: true, ...changes });
const calc = (promotions, start = '2030-01-03', end = '2030-01-05', roomType = room, dateAdjustments = [], vat = false, options = new Set(), global = adjustment) =>
  calculateForRoomLogic(roomType, start, end, dateAdjustments, global, promotions, vat, 10, options);

for (const [name, changes, expected] of [
  ['percentage per night', {}, 92000],
  ['fixed amount per night', { isPercentage: false, discountAmount: 50000 }, 100000],
  ['percentage per stay', { discountBasis: 'per_stay' }, 92000],
  ['fixed amount per stay', { isPercentage: false, discountBasis: 'per_stay', discountAmount: 100000 }, 100000],
  ['nightly cap before stay cap', { discountAmount: 20, maxDiscountPerNight: 50000, maxDiscountPerStay: 70000 }, 70000],
  ['stay percentage with nightly cap', { discountBasis: 'per_stay', discountAmount: 20, maxDiscountPerNight: 50000 }, 100000],
  ['zero nightly cap', { maxDiscountPerNight: 0 }, 0],
  ['zero stay cap', { maxDiscountPerStay: 0 }, 0],
  ['fixed discount cannot exceed price of each night', { isPercentage: false, discountAmount: 500000 }, 920000],
  ['fixed stay discount cannot exceed eligible total', { isPercentage: false, discountBasis: 'per_stay', discountAmount: 1000000 }, 920000],
]) {
  test(name, () => {
    const result = calc([rule(changes)]);
    assert.equal(result.stayDiscountValue, expected);
    assert.equal(result.finalTotal, 920000 - expected);
  });
}

test('filters active status, minimum nights, branch and room independently', () => {
  const cases = [
    [{ isActive: false }, false], [{ minNights: 3 }, false], [{ minNights: 2 }, true],
    [{ branchId: 'other' }, false], [{ branchId: 'b1' }, true],
    [{ roomTypeId: 'other' }, false], [{ roomTypeId: 'r1' }, true],
    [{ branchId: 'b1', roomTypeId: 'r1' }, true], [{ branchId: 'b1', roomTypeId: 'other' }, false],
  ];
  for (const [changes, eligible] of cases) {
    assert.equal(calc([rule(changes)]).stayDiscountValue, eligible ? 92000 : 0, JSON.stringify(changes));
  }
});

test('date boundaries are inclusive for nights and exclude checkout', () => {
  const cases = [
    [{ stayStart: '2030-01-03', stayEnd: '2030-01-03' }, 44000],
    [{ stayStart: '2030-01-04', stayEnd: '2030-01-04' }, 48000],
    [{ stayStart: '2030-01-05' }, 0], [{ stayEnd: '2030-01-02' }, 0],
    [{ stayStart: '2030-01-04' }, 48000], [{ stayEnd: '2030-01-03' }, 44000],
    [{ stayStart: '2030-01-03', stayEnd: '2030-01-04' }, 92000],
    [{ stayStart: '2030-01-04', discountBasis: 'per_stay' }, 48000],
    [{ stayStart: '2030-01-04', discountBasis: 'per_stay', isPercentage: false, discountAmount: 100000 }, 100000],
  ];
  for (const [changes, expected] of cases) assert.equal(calc([rule(changes)]).stayDiscountValue, expected, JSON.stringify(changes));
});

test('chooses largest actual capped discount, then priority, and ignores zero-value rules', () => {
  const promotions = [rule({ id: 'a', discountAmount: 20, maxDiscountPerStay: 30000, priority: 100 }), rule({ id: 'b', discountAmount: 10, priority: 1 }), rule({ id: 'c', discountAmount: 10, priority: 2 })];
  const result = calc(promotions);
  assert.equal(result.stayDiscount.id, 'c');
  assert.equal(result.stayDiscountValue, 92000);
  const zero = calc([rule({ discountAmount: 0 })]);
  assert.equal(zero.stayDiscount, undefined);
  assert.equal(zero.stayDiscountValue, 0);
});

test('promotion uses adjusted nightly prices before early fees and VAT', () => {
  const dates = [{ id: 'd', date: '2030-01-03', type: 'surcharge', amount: 100000, isPercentage: false, note: 'Lễ' }];
  const options = new Set(['early_1230']);
  const result = calc([rule()], '2030-01-03', '2030-01-05', room, dates, true, options);
  assert.equal(result.totalBase, 1020000);
  assert.equal(result.stayDiscountValue, 102000);
  assert.equal(result.finalTotal, 1174800);
  assert.equal(result.deposit, 587400);
  const lines = getPriceBreakdown([{ calculation: result, options, checkOut: '2030-01-05' }], adjustment, result.vatValue, result.finalTotal, false);
  assert.ok(lines.some(line => line.label === 'Ưu đãi' && line.amount === -102000));
  assert.equal(lines.filter(line => line.kind !== 'total').reduce((sum, line) => sum + line.amount, 0), result.finalTotal);
});

test('each included room selects its own promotion before overall VAT', () => {
  const second = { ...room, id: 'r2', branchId: 'b2', weekdayPrice: 500000, weekendPrice: 500000 };
  const rooms = [
    { id: '1', roomId: 'r1', branchId: 'b1', checkIn: '2030-01-03', checkOut: '2030-01-05', earlyLateOptions: new Set() },
    { id: '2', roomId: 'r2', branchId: 'b2', checkIn: '2030-01-03', checkOut: '2030-01-05', earlyLateOptions: new Set() },
    { id: '3', roomId: 'r1', branchId: 'b1', checkIn: '2030-01-03', checkOut: '2030-01-05', earlyLateOptions: new Set(), isIncluded: false },
  ];
  const promos = [rule({ id: 'a', name: 'Phòng 1', roomTypeId: 'r1' }), rule({ id: 'b', name: 'Phòng 2', roomTypeId: 'r2', discountAmount: 20 })];
  const result = calculateMultiRoomLogic(rooms, [room, second], [{ id: 'b1', name: 'A' }, { id: 'b2', name: 'B' }], [], adjustment, promos, true, 10);
  assert.equal(result.items[0].calculation.stayDiscount.name, 'Phòng 1');
  assert.equal(result.items[1].calculation.stayDiscount.name, 'Phòng 2');
  assert.equal(result.totalStayDiscounts, 292000);
  assert.equal(result.finalTotal, 1790800);
  assert.equal(result.deposit, 895400);
});

test('manual promotion requires a tick and stacks with the automatic promotion', () => {
  const automatic = rule({ id: 'auto', discountAmount: 5 });
  const manual = rule({ id: 'manual', name: 'Google Maps', selectionMode: 'manual', discountBasis: 'per_stay', maxDiscountPerStay: 70000 });
  const without = calc([automatic, manual]);
  assert.equal(without.stayDiscount.id, 'auto');
  assert.equal(without.manualDiscounts.length, 0);
  const withManual = calc([automatic, manual], '2030-01-03', '2030-01-05', room, [], false, new Set(), { ...adjustment, selectedPromotionIds: ['manual'] });
  assert.equal(withManual.stayDiscountValue, 46000);
  assert.equal(withManual.manualDiscounts[0].amount, 70000);
  assert.equal(withManual.finalTotal, 804000);
  const lines = getPriceBreakdown([{ calculation: withManual, options: new Set(), checkOut: '2030-01-05' }], adjustment, 0, withManual.finalTotal, false);
  assert.ok(lines.some(line => line.label === 'Google Maps' && line.amount === -70000));
});

test('manual per-stay cap applies once across included rooms and respects eligibility', () => {
  const item = { id: '1', roomId: 'r1', branchId: 'b1', checkIn: '2030-01-03', checkOut: '2030-01-05', earlyLateOptions: new Set() };
  const manual = rule({ id: 'manual', selectionMode: 'manual', discountBasis: 'per_stay', maxDiscountPerStay: 70000 });
  const result = calculateMultiRoomLogic([item, { ...item, id: '2' }, { ...item, id: '3', isIncluded: false }], [room], [{ id: 'b1', name: 'B' }], [], { ...adjustment, selectedPromotionIds: ['manual'] }, [manual], true, 10);
  assert.equal(result.manualDiscounts[0].amount, 70000);
  assert.equal(result.finalTotal, 1947000);
  assert.equal(result.items[0].calculation.manualDiscounts.length, 0);
  const outside = calc([{ ...manual, stayStart: '2030-02-01' }], '2030-01-03', '2030-01-05', room, [], false, new Set(), { ...adjustment, selectedPromotionIds: ['manual'] });
  assert.equal(outside.manualDiscounts.length, 0);
});
