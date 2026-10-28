import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateForRoomLogic, calculateMultiRoomLogic } from '../src/lib/hotelCalculator.ts';

const room = { id: 'r1', branchId: 'b1', name: 'Standard', weekdayPrice: 1000000, weekendPrice: 1500000 };
const branch = { id: 'b1', name: 'Branch' };
const noAdjustment = { type: 'discount', amount: 0, isPercentage: false };
const calculate = (start, end, adjustments = [], global = noAdjustment, discounts = [], vat = false, options = new Set()) =>
    calculateForRoomLogic(room, start, end, adjustments, global, discounts, vat, 10, options);

test('rejects missing, invalid, reversed and zero-night stays', () => {
    for (const [start, end] of [['', '2026-09-10'], ['invalid', '2026-09-10'], ['2026-09-10', '2026-09-10'], ['2026-09-11', '2026-09-10']]) {
        assert.equal(calculate(start, end), null);
    }
});

test('charges Friday and Saturday as weekends, excludes checkout night', () => {
    const result = calculate('2026-09-10', '2026-09-14');
    assert.deepEqual(result.nights.map(n => n.finalPrice), [1000000, 1500000, 1500000, 1000000]);
    assert.equal(result.finalTotal, 5000000);
    assert.equal(result.deposit, 2500000);
});

test('stacks adjustments against base price and applies adjacent-night fees', () => {
    const adjustments = [
        { date: '2026-09-09', type: 'surcharge', amount: 20, isPercentage: true },
        { date: '2026-09-10', type: 'surcharge', amount: 10, isPercentage: true },
        { date: '2026-09-10', type: 'discount', amount: 5, isPercentage: true },
        { date: '2026-09-11', type: 'surcharge', amount: 100000, isPercentage: false },
    ];
    const result = calculate('2026-09-10', '2026-09-11', adjustments, noAdjustment, [], false, new Set(['early_0800', 'late_1800']));
    assert.equal(result.totalBase, 1050000);
    assert.equal(result.previousNightPrice, 1200000);
    assert.equal(result.nextNightPrice, 1600000);
    assert.equal(result.earlyLateTotal, 600000); // Friday checkout forbids late_1800.
    assert.equal(result.finalTotal, 1650000);
    const weekday = calculate('2026-09-09', '2026-09-10', adjustments, noAdjustment, [], false, new Set(['late_1800']));
    assert.equal(weekday.earlyLateTotal, 840000);
});

test('selects highest eligible night threshold, preserves ties and VAT order', () => {
    const discounts = [
        { minNights: 1, discountAmount: 5, isPercentage: true },
        { minNights: 3, discountAmount: 10, isPercentage: true },
        { minNights: 3, discountAmount: 20, isPercentage: true },
        { minNights: 7, discountAmount: 50, isPercentage: true },
    ];
    const original = structuredClone(discounts);
    const result = calculate('2026-09-07', '2026-09-10', [], { type: 'surcharge', amount: 10, isPercentage: true }, discounts, true, new Set(['early_1230', 'late_1300']));
    assert.equal(result.stayDiscount, discounts[1]);
    assert.equal(result.stayDiscountValue, 300000);
    assert.equal(result.globalAdjustmentValue, 300000);
    assert.equal(result.earlyLateTotal, 250000);
    assert.equal(result.vatValue, 325000);
    assert.equal(result.finalTotal, 3575000);
    assert.deepEqual(discounts, original);
});

test('multi-room totals exclude unchecked/invalid rooms and apply VAT once', () => {
    const item = { id: '1', roomId: 'r1', branchId: 'b1', checkIn: '2026-09-07', checkOut: '2026-09-08', earlyLateOptions: new Set(['early_1300']) };
    const result = calculateMultiRoomLogic([item, { ...item, id: '2', isIncluded: false }, { ...item, id: '3', roomId: 'missing' }], [room], [branch], [], { type: 'discount', amount: 10, isPercentage: true }, [], true, 10);
    assert.equal(result.items.length, 3);
    assert.equal(result.totalRooms, 1);
    assert.equal(result.totalNights, 1);
    assert.equal(result.totalBase, 1000000);
    assert.equal(result.totalEarlyLate, 100000);
    assert.equal(result.globalAdjustmentValue, 110000);
    assert.equal(result.vatValue, 99000);
    assert.equal(result.finalTotal, 1089000);
    assert.equal(result.deposit, 544500);
    assert.equal(result.items[1].calculation.finalTotal, 1100000);
    assert.equal(result.items[2].calculation, null);
});

test('multi-room discount cannot produce a negative payable total', () => {
    const result = calculateMultiRoomLogic([], [room], [branch], [], { type: 'discount', amount: 1000000, isPercentage: false }, [], true, 10);
    assert.equal(result.finalTotal, 0);
    assert.equal(result.vatValue, 0);
    assert.equal(result.deposit, 0);
});

test('Google Maps Reviews discount is 10% of the pre-VAT subtotal, capped at 70,000', () => {
    const google = { type: 'discount', amount: 10, isPercentage: true, preset: 'google_reviews' };
    const cheapRoom = { ...room, weekdayPrice: 500000 };
    const low = calculateForRoomLogic(cheapRoom, '2026-09-07', '2026-09-08', [], google, [], true, 10);
    assert.equal(low.globalAdjustmentValue, 50000);
    assert.equal(low.finalTotal, 495000);
    const capped = calculate('2026-09-07', '2026-09-08', [], google);
    assert.equal(capped.globalAdjustmentValue, 70000);
    assert.equal(capped.finalTotal, 930000);
    const item = { id: '1', roomId: 'r1', branchId: 'b1', checkIn: '2026-09-07', checkOut: '2026-09-08', earlyLateOptions: new Set() };
    const multi = calculateMultiRoomLogic([item, { ...item, id: '2' }], [room], [branch], [], google, [], false, 10);
    assert.equal(multi.globalAdjustmentValue, 70000);
    assert.equal(multi.finalTotal, 1930000);
    const empty = calculateMultiRoomLogic([], [room], [branch], [], google, [], false, 10);
    assert.equal(empty.globalAdjustmentValue, 0);
});

test('22:00 check-in discounts only the first adjusted night, before VAT', () => {
    const adjustments = [{ date: '2026-09-11', type: 'surcharge', amount: 10, isPercentage: true }];
    const result = calculate('2026-09-11', '2026-09-13', adjustments, noAdjustment, [], true, new Set(['checkin_2200']));
    assert.equal(result.totalBase, 3150000);
    assert.equal(result.earlyLateTotal, -330000);
    assert.equal(result.vatValue, 282000);
    assert.equal(result.finalTotal, 3102000);
    assert.equal(result.deposit, 1551000);
});

test('22:00 check-in excludes early arrival fees but allows late checkout', () => {
    const result = calculate('2026-09-07', '2026-09-08', [], noAdjustment, [], false,
        new Set(['checkin_2200', 'early_0800', 'early_1230', 'early_1300', 'late_1300']));
    assert.equal(result.earlyLateTotal, -100000);
    assert.equal(result.finalTotal, 900000);
});

test('multi-room 22:00 discount affects only included rooms and precedes VAT', () => {
    const item = { id: '1', roomId: 'r1', branchId: 'b1', checkIn: '2026-09-07', checkOut: '2026-09-08', earlyLateOptions: new Set(['checkin_2200']) };
    const result = calculateMultiRoomLogic([item, { ...item, id: '2', isIncluded: false }], [room], [branch], [], noAdjustment, [], true, 10);
    assert.equal(result.totalEarlyLate, -200000);
    assert.equal(result.finalTotal, 880000);
    assert.equal(result.deposit, 440000);
});
