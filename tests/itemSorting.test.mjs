import assert from 'node:assert/strict';
import test from 'node:test';
import { groupItemsByKind } from '../src/components/groupItemsByKind.ts';

const item = (id, name, kind, price) => ({
  id, item_name: name, kind, quantity: 1, unit_price: price,
});

test('sorts compensation items by descending price inside each existing group', () => {
  const groups = groupItemsByKind([
    item('1', 'Khăn', 'CÁI', 100_000),
    item('2', 'Nệm', 'CÁI', 5_000_000),
    item('3', 'Dép', 'ĐÔI', 50_000),
    item('4', 'Gối', 'CÁI', 100_000),
    item('5', 'Mền', 'ĐÔI', 200_000),
  ]);

  assert.deepEqual(groups.map(([kind]) => kind), ['CÁI', 'ĐÔI']);
  assert.deepEqual(groups.map(([, items]) => items.map(({ id }) => id)), [
    ['2', '4', '1'],
    ['5', '3'],
  ]);
});

test('groups missing kinds under Khác and orders equal prices by Vietnamese name', () => {
  const groups = groupItemsByKind([
    item('1', 'Vỏ gối', null, 100_000),
    item('2', 'Áo gối', null, 100_000),
  ]);

  assert.equal(groups[0][0], 'Khác');
  assert.deepEqual(groups[0][1].map(({ id }) => id), ['2', '1']);
});
