import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { ItineraryDay, ItineraryBlock, CommentThread, AwareUser, Comment } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../hooks/useToast.ts';
import { getAuthToken } from '../services/api.ts';

const docMap = new Map<string, {
    doc: Y.Doc;
    provider: WebsocketProvider;
    persistence: IndexeddbPersistence;
    undoManager: Y.UndoManager;
}>();

const yMapToBlock = (map: Y.Map<any>): ItineraryBlock => ({ ...map.toJSON() } as ItineraryBlock);
const yArrayToBlocks = (arr: Y.Array<Y.Map<any>>): ItineraryBlock[] => arr.map(yMapToBlock);
const yMapToDay = (map: Y.Map<any>): ItineraryDay => ({
    ...map.toJSON(),
    blocks: map.has('blocks') ? yArrayToBlocks(map.get('blocks') as Y.Array<Y.Map<any>>) : [],
} as ItineraryDay);
const blockToYMap = (block: ItineraryBlock): Y.Map<any> => {
    const yMap = new Y.Map();
    Object.entries(block).forEach(([key, value]) => yMap.set(key, value));
    return yMap;
};
// FIX: Cast the result of yMap.toJSON() to satisfy the CommentThread type, which expects id and isResolved properties.
const yMapToCommentThread = (yMap: Y.Map<any>): CommentThread => ({
    ...(yMap.toJSON() as Pick<CommentThread, 'id' | 'isResolved'>),
    comments: (yMap.get('comments') as Y.Array<Y.Map<any>>)?.map(c => c.toJSON() as Comment) || []
});

export const useSharedItinerary = (tripId: string, initialItinerary: ItineraryDay[]) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
    const [isSynced, setIsSynced] = useState(false);
    const [recentlyUpdatedBlockId, setRecentlyUpdatedBlockId] = useState<string | null>(null);
    const localOrigin = useRef(`sasgo-client-${uuidv4()}`).current;
    
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const [awareUsers, setAwareUsers] = useState<AwareUser[]>([]);
    const [commentThreads, setCommentThreads] = useState<Map<string, CommentThread>>(new Map());

    const session = useMemo(() => {
        if (!tripId || !user) return null;
        if (docMap.has(tripId)) return docMap.get(tripId)!;

        const doc = new Y.Doc();
        const token = getAuthToken();
        const wsUrl = `ws://${window.location.host}?token=${encodeURIComponent(token || '')}&tripId=${encodeURIComponent(tripId)}`;
        const provider = new WebsocketProvider(wsUrl, tripId, doc);
        
        provider.awareness.setLocalStateField('user', {
            name: user.name || 'Anonymous',
            id: user.id,
            color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
        });

        const persistence = new IndexeddbPersistence(tripId, doc);
        const yItineraryArr = doc.getArray<Y.Map<any>>('itinerary');
        const yComments = doc.getMap('comments');
        const undoManager = new Y.UndoManager([yItineraryArr, yComments]);

        const newSession = { doc, provider, persistence, undoManager };
        docMap.set(tripId, newSession);
        return newSession;
    }, [tripId, user]);

    useEffect(() => {
        if (!session) return;
        
        const { doc, provider, undoManager } = session;
        const yItinerary = doc.getArray<Y.Map<any>>('itinerary');
        const yComments = doc.getMap<Y.Map<any>>('comments');

        const itineraryObserver = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
            if (!transaction.local) {
                addToast('El itinerario fue actualizado.', 'info');
                events.forEach(event => {
                    const targetMap = event.target as Y.Map<any>;
                    if (targetMap instanceof Y.Map && targetMap.get('id')) {
                        const blockId = targetMap.get('id');
                        setRecentlyUpdatedBlockId(blockId);
                        setTimeout(() => setRecentlyUpdatedBlockId(null), 3000);
                    }
                });
            }
            setItinerary(yItinerary.map(yMapToDay));
        };

        const commentsObserver = () => {
            const newThreads = new Map<string, CommentThread>();
            yComments.forEach((yThread, blockId) => {
                newThreads.set(blockId, yMapToCommentThread(yThread));
            });
            setCommentThreads(new Map(newThreads));
        };
        
        const awarenessObserver = () => {
            const users = Array.from(provider.awareness.getStates().entries())
                .filter(([_, state]) => state.user && state.user.id !== user?.id)
                .map(([clientId, state]) => ({ clientId, state } as AwareUser));
            setAwareUsers(users);
        };

        const updateUndoRedoState = () => {
            setCanUndo(undoManager.canUndo());
            setCanRedo(undoManager.canRedo());
        };

        yItinerary.observeDeep(itineraryObserver);
        yComments.observeDeep(commentsObserver);
        provider.awareness.on('change', awarenessObserver);
        undoManager.on('stack-item-added', updateUndoRedoState);
        undoManager.on('stack-item-popped', updateUndoRedoState);

        provider.on('sync', (synced: boolean) => {
            setIsSynced(synced);
            if (synced && yItinerary.length === 0 && initialItinerary.length > 0) {
                doc.transact(() => {
                     initialItinerary.forEach(day => {
                        const yDay = new Y.Map();
                        Object.entries(day).forEach(([key, val]) => {
                           if (key !== 'blocks') yDay.set(key, val);
                        });
                        const yBlocks = Y.Array.from(day.blocks.map(blockToYMap));
                        yDay.set('blocks', yBlocks);
                        yItinerary.push([yDay]);
                    });
                }, localOrigin);
            }
            setItinerary(yItinerary.map(yMapToDay));
            commentsObserver();
            awarenessObserver();
            updateUndoRedoState();
        });

        setItinerary(yItinerary.map(yMapToDay));
        commentsObserver();
        awarenessObserver();
        updateUndoRedoState();

        provider.connect();

        return () => {
            provider.disconnect();
            docMap.delete(tripId);
            yItinerary.unobserveDeep(itineraryObserver);
            yComments.unobserveDeep(commentsObserver);
            provider.awareness.off('change', awarenessObserver);
            undoManager.off('stack-item-added', updateUndoRedoState);
            undoManager.off('stack-item-popped', updateUndoRedoState);
        };
    }, [session, initialItinerary, localOrigin, addToast, tripId, user?.id]);

    const setItineraryWrapper = useCallback((newItinerary: ItineraryDay[]) => {
        if (!session) return;
        const yItinerary = session.doc.getArray<Y.Map<any>>('itinerary');
        session.undoManager.stopCapturing();
        session.doc.transact(() => {
            yItinerary.delete(0, yItinerary.length);
            newItinerary.forEach(day => {
                const yDay = new Y.Map();
                Object.entries(day).forEach(([key, val]) => { if (key !== 'blocks') yDay.set(key, val) });
                const yBlocks = Y.Array.from(day.blocks.map(blockToYMap));
                yDay.set('blocks', yBlocks);
                yItinerary.push([yDay]);
            });
        }, localOrigin);
        session.undoManager.clear();
    }, [session, localOrigin]);

    const findBlockYMap = (blockId: string): Y.Map<any> | null => {
        const yItinerary = session!.doc.getArray<Y.Map<any>>('itinerary');
        for (const yDay of yItinerary) {
            const yBlocks = yDay.get('blocks') as Y.Array<Y.Map<any>>;
            for (const yBlock of yBlocks) {
                if (yBlock.get('id') === blockId) return yBlock;
            }
        }
        return null;
    };

    const addBlock = useCallback((newBlockData: Omit<ItineraryBlock, 'id'>) => {
        if (!session) return;
        const newBlock = { ...newBlockData, id: uuidv4() };
        const yItinerary = session.doc.getArray<Y.Map<any>>('itinerary');
        session.doc.transact(() => {
            let dayFound = false;
            yItinerary.forEach(yDay => {
                if (yDay.get('date') === newBlock.date) {
                    (yDay.get('blocks') as Y.Array<Y.Map<any>>).push([blockToYMap(newBlock as ItineraryBlock)]);
                    dayFound = true;
                }
            });
            if (!dayFound) {
                const dayIndex = itinerary.findIndex(d => d.date === newBlock.date);
                const yDay = new Y.Map();
                yDay.set('date', newBlock.date);
                yDay.set('dayIndex', dayIndex !== -1 ? itinerary[dayIndex].dayIndex : itinerary.length + 1);
                const yBlocks = new Y.Array();
                yBlocks.push([blockToYMap(newBlock as ItineraryBlock)]);
                yDay.set('blocks', yBlocks);
                yItinerary.push([yDay]);
            }
        }, localOrigin);
    }, [session, localOrigin, itinerary]);

    const updateBlock = useCallback((blockId: string, updates: Partial<ItineraryBlock>) => {
        if (!session) return;
        session.doc.transact(() => {
            const yBlock = findBlockYMap(blockId);
            if (yBlock) {
                Object.entries(updates).forEach(([key, value]) => yBlock.set(key, value));
            }
        }, localOrigin);
    }, [session, localOrigin]);
    
    const deleteBlock = useCallback((blockId: string) => {
        if (!session) return;
        const yItinerary = session.doc.getArray<Y.Map<any>>('itinerary');
        session.doc.transact(() => {
            yItinerary.forEach(yDay => {
                const yBlocks = yDay.get('blocks') as Y.Array<Y.Map<any>>;
                let indexToDelete = -1;
                yBlocks.forEach((yBlock, i) => {
                    if (yBlock.get('id') === blockId) {
                        indexToDelete = i;
                    }
                });
                if (indexToDelete > -1) yBlocks.delete(indexToDelete, 1);
            });
        }, localOrigin);
    }, [session, localOrigin]);
    
    const reorderBlocks = useCallback((dayDate: string, oldIndex: number, newIndex: number) => {
        if (!session) return;
        const yItinerary = session.doc.getArray<Y.Map<any>>('itinerary');
        session.doc.transact(() => {
            // FIX: Replaced Y.Array.find with a standard loop as '.find' is not a method on Y.Array.
            let yDay: Y.Map<any> | undefined;
            for (const day of yItinerary.toArray()) {
                if (day.get('date') === dayDate) {
                    yDay = day;
                    break;
                }
            }
            if (yDay) {
                const yBlocks = yDay.get('blocks') as Y.Array<Y.Map<any>>;
                const yBlock = yBlocks.get(oldIndex);
                yBlocks.delete(oldIndex, 1);
                yBlocks.insert(newIndex, [yBlock]);
            }
        }, localOrigin);
    }, [session, localOrigin]);

    const undo = useCallback(() => session?.undoManager.undo(), [session]);
    const redo = useCallback(() => session?.undoManager.redo(), [session]);

    const addComment = useCallback((blockId: string, content: string) => {
        if (!session || !user) return;
        const yComments = session.doc.getMap<Y.Map<any>>('comments');
        session.doc.transact(() => {
            if (!yComments.has(blockId)) {
                const newThread = new Y.Map();
                newThread.set('id', blockId);
                newThread.set('isResolved', false);
                newThread.set('comments', new Y.Array());
                yComments.set(blockId, newThread);
            }
            const yThread = yComments.get(blockId)!;
            const yCommentsArray = yThread.get('comments') as Y.Array<Y.Map<any>>;
            
            const commentMap = new Y.Map();
            commentMap.set('id', uuidv4());
            commentMap.set('authorId', user.id);
            commentMap.set('authorName', user.name);
            commentMap.set('authorAvatar', `https://i.pravatar.cc/150?u=${user.email}`);
            commentMap.set('content', content);
            commentMap.set('timestamp', new Date().toISOString());
            yThread.set('isResolved', false); // Re-open thread on new comment

            yCommentsArray.push([commentMap]);
        }, localOrigin);
    }, [session, localOrigin, user]);

    const toggleCommentThreadResolved = useCallback((blockId: string) => {
        if (!session) return;
        const yComments = session.doc.getMap<Y.Map<any>>('comments');
        session.doc.transact(() => {
            if (yComments.has(blockId)) {
                const yThread = yComments.get(blockId)!;
                yThread.set('isResolved', !yThread.get('isResolved'));
            }
        }, localOrigin);
    }, [session, localOrigin]);

    return {
        itinerary, isSynced, recentlyUpdatedBlockId,
        setItinerary: setItineraryWrapper, addBlock, updateBlock, deleteBlock, reorderBlocks,
        undo, redo, canUndo, canRedo,
        awareUsers, awareness: session?.provider.awareness,
        commentThreads, addComment, toggleCommentThreadResolved,
    };
};