import { lazy, memo } from 'react';
import type { Item } from '../../components/types';

const loadItemCompensation = () => import('../../components/ItemCompensation')
  .then(module => ({ default: module.ItemCompensation }));

export const preloadItemsView = () => loadItemCompensation().then(() => undefined);

const ItemCompensation = lazy(loadItemCompensation);

export interface ItemsViewProps {
  items: Item[];
  selectedQuantities: Record<string, number>;
  onChangeQuantity: (id: string, quantity: number) => void;
  formatCurrency: (amount: number) => string;
}

function ItemsViewBase({ items, selectedQuantities, onChangeQuantity, formatCurrency }: ItemsViewProps) {
  return (
    <div className="max-w-[1600px] mx-auto">
      <ItemCompensation
        items={items}
        selectedQuantities={selectedQuantities}
        onChangeQuantity={onChangeQuantity}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

export const ItemsView = memo(ItemsViewBase);
