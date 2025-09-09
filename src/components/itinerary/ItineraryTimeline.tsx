
import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ItineraryDay, ItineraryBlock, HHMM, CommentThread } from '../../types.ts';
import BlockCard from './BlockCard.tsx';
import GapCard from './GapCard.tsx';
import { findAllGaps, toMin } from '../../lib/itinerary-time.ts';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ItineraryTimelineProps {
    itineraryId: string;
    days: ItineraryDay[];
    commentThreads: Map<string, CommentThread>;
    onSaveBlock: (blockId: string, updates: Partial<ItineraryBlock>) => void;
    onDeleteBlock: (blockId: string) => void;
    onDuplicateBlock: (blockId: string) => void;
    onSuggestActivity: (day: ItineraryDay, gap: { start: HHMM; end: HHMM }) => void;
    onSelectCommentBlock: (blockId: string | null) => void;
    recentlyUpdatedBlock: string | null;
    onDragEnd: (event: DragEndEvent) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00-03:00');
  const formatted = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

type VirtualItem = 
    | { id: string; type: 'DAY_HEADER'; day: ItineraryDay; }
    | { id: string; type: 'BLOCK'; block: ItineraryBlock; day: ItineraryDay }
    | { id: string; type: 'GAP'; gap: { start: HHMM; end: HHMM }; day: ItineraryDay };

const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ 
    itineraryId, days, commentThreads, onSaveBlock, onDeleteBlock, onDuplicateBlock, 
    onSuggestActivity, onSelectCommentBlock, recentlyUpdatedBlock, onDragEnd, containerRef 
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const { flatItems, dndItems } = useMemo(() => {
        const flat: VirtualItem[] = [];
        const dnd: string[] = [];
        days.forEach((day) => {
            flat.push({ id: day.date, type: 'DAY_HEADER', day });
            
            const gaps = findAllGaps(day);
            const timelineItems: (ItineraryBlock | { start: HHMM; end: HHMM })[] = [...day.blocks, ...gaps];
            
            timelineItems.sort((a, b) => 
                toMin('startTime' in a ? a.startTime : a.start) - 
                toMin('startTime' in b ? b.startTime : b.start)
            );

            timelineItems.forEach((item, index) => {
                if ('id' in item) { // ItineraryBlock
                    flat.push({ id: item.id, type: 'BLOCK', block: item, day });
                    dnd.push(item.id);
                } else { // Gap
                    flat.push({ id: `${day.date}-gap-${index}`, type: 'GAP', gap: item, day });
                }
            });
        });
        return { flatItems: flat, dndItems: dnd };
    }, [days]);

    const rowVirtualizer = useVirtualizer({
        count: flatItems.length,
        getScrollElement: () => containerRef.current,
        estimateSize: (index) => flatItems[index].type === 'DAY_HEADER' ? 48 : 120,
        overscan: 5,
    });

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={dndItems} strategy={verticalListSortingStrategy}>
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map(virtualItem => {
                        const item = flatItems[virtualItem.index];

                        return (
                            <div
                                key={item.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                <div className="relative pl-8 border-l-2 border-gray-200 dark:border-gray-700 h-full">
                                    {item.type === 'DAY_HEADER' && (
                                        <div id={`itinerary-day-${item.day.date}`} className="scroll-mt-6 pt-4 -ml-8">
                                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 pl-8">{`Día ${item.day.dayIndex}: ${formatDate(item.day.date)}`}</h3>
                                        </div>
                                    )}
                                    {item.type === 'BLOCK' && (
                                        <BlockCard
                                            itineraryId={itineraryId}
                                            block={item.block}
                                            dayBlocks={item.day.blocks}
                                            comments={commentThreads.get(item.block.id)?.comments || []}
                                            isResolved={commentThreads.get(item.block.id)?.isResolved || false}
                                            onSave={onSaveBlock}
                                            onDelete={onDeleteBlock}
                                            onDuplicate={onDuplicateBlock}
                                            onSelectCommentBlock={() => onSelectCommentBlock(item.block.id)}
                                            isRecentlyUpdated={item.block.id === recentlyUpdatedBlock}
                                        />
                                    )}
                                    {item.type === 'GAP' && (
                                        <GapCard 
                                            gap={item.gap} 
                                            onSuggest={() => onSuggestActivity(item.day, item.gap)} 
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default ItineraryTimeline;
