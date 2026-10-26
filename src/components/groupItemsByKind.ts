import type { Item } from './types';

export function groupItemsByKind(items: Item[]): Array<[string, Item[]]> {
    const groups = new Map<string, Item[]>();
    for (const item of items) {
        const kind = item.kind || 'Khác';
        const group = groups.get(kind);
        if (group) group.push(item);
        else groups.set(kind, [item]);
    }

    return Array.from(groups, ([kind, group]) => [
        kind,
        [...group].sort((a, b) => b.unit_price - a.unit_price || a.item_name.localeCompare(b.item_name, 'vi')),
    ]);
}
