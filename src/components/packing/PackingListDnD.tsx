import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ItemRow from './ItemRow.tsx';
import type { PackingListItem } from '../../types.ts';

interface Props {
  items: PackingListItem[];
  onUpdate: (id: string, fields: Partial<Omit<PackingListItem, 'id'>>) => void;
  onReorder: (itemIds: string[]) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const PackingListDnD: React.FC<Props> = ({ items, onUpdate, onReorder, onRemove, onDuplicate }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newOrder = [...items];
        const [movedItem] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, movedItem);
        onReorder(newOrder.map(i => i.id));
    }
  };
  
  const itemIds = items.map(i => i.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3" role="list" aria-label="Lista de equipaje editable">
          {items.map(item => (
            <ItemRow 
                key={item.id} 
                item={item} 
                onUpdate={onUpdate}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default PackingListDnD;