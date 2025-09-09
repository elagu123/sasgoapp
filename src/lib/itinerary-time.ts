
import type { HHMM, ItineraryBlock, ItineraryDay } from '../types';

/**
 * Converts HH:MM string to minutes from midnight.
 * @param time - The time string in HH:MM format.
 * @returns Number of minutes from midnight.
 */
export const toMin = (time: HHMM): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Converts minutes from midnight to HH:MM string.
 * @param minutes - The number of minutes from midnight.
 * @returns Time string in HH:MM format.
 */
export const fromMin = (minutes: number): HHMM => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` as HHMM;
};

/**
 * Calculates the duration in minutes between two HH:MM times.
 * Returns null if end is before start.
 */
export const durationMin = (start?: HHMM, end?: HHMM): number | null => {
    if (!start || !end) return 0;
    const startMin = toMin(start);
    const endMin = toMin(end);
    if (endMin < startMin) return null;
    return endMin - startMin;
};

/**
 * Checks if a given time string is in valid HH:MM format.
 */
export const isHHMM = (s: string): s is HHMM => /^([01]\d|2[0-3]):([0-5]\d)$/.test(s);

type Interval = { startTime?: HHMM, endTime?: HHMM };

/**
 * Checks if two time intervals overlap.
 * Adjacent intervals (e.g., 10:00-11:00 and 11:00-12:00) do not overlap.
 */
export const overlaps = (a: { start: HHMM, end: HHMM }, b: { start: HHMM, end: HHMM }): boolean => {
    const aStart = toMin(a.start);
    const aEnd = toMin(a.end);
    const bStart = toMin(b.start);
    const bEnd = toMin(b.end);
    return aStart < bEnd && bStart < aEnd;
};

/**
 * Checks for time conflicts within a set of blocks for a new or updated block.
 * @param dayBlocks - All blocks for a specific day.
 * @param block - The block to check for conflicts.
 * @param ignoreId - The ID of the block to ignore (used when updating an existing block).
 * @returns An object indicating if there is a conflict and with which block.
 */
export const hasConflicts = (dayBlocks: Interval[], block: Interval, ignoreId?: string): { conflict: boolean, with?: Interval & { id?: string; title?: string } } => {
    if (!block.startTime || !block.endTime) return { conflict: false };

    for (const existingBlock of dayBlocks) {
        if ((existingBlock as any).id === ignoreId) continue;
        if (!existingBlock.startTime || !existingBlock.endTime) continue;
        
        const existing = { start: existingBlock.startTime, end: existingBlock.endTime };
        const current = { start: block.startTime, end: block.endTime };

        if (overlaps(existing, current)) {
            return { conflict: true, with: existingBlock as any };
        }
    }
    return { conflict: false };
};


/**
 * Generates a user-friendly conflict message.
 */
export const conflictMessage = (withBlock: { title?: string } | undefined, locale: "es-AR" | "en-US"): string => {
    const withTitle = withBlock?.title ? ` con "${withBlock.title}"` : '';
    return locale === "es-AR" ? `El horario se solapa${withTitle}.` : `This time overlaps${withTitle}.`;
};

/**
 * Finds all gaps of a minimum duration in an itinerary day.
 * @param day - The itinerary day with its blocks.
 * @param minGapMinutes - The minimum duration for a gap to be considered.
 * @returns An array of gap objects with start and end times.
 */
export const findAllGaps = (day: ItineraryDay, minGapMinutes: number = 60): { start: HHMM, end: HHMM }[] => {
    const sortedBlocks = [...day.blocks].sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));
    
    const gaps: { start: HHMM, end: HHMM }[] = [];
    const dayStart = '09:00' as HHMM; // Assuming a reasonable start
    const dayEnd = '22:00' as HHMM;   // Assuming a reasonable end

    let lastEndTime = dayStart;

    for (const block of sortedBlocks) {
        if (!block.startTime) continue;
        const currentStartTime = block.startTime;
        const duration = durationMin(lastEndTime, currentStartTime);
        if (duration !== null && duration >= minGapMinutes) {
            gaps.push({ start: lastEndTime, end: currentStartTime });
        }
        if (block.endTime && toMin(block.endTime) > toMin(lastEndTime)) {
          lastEndTime = block.endTime;
        }
    }

    // Check gap at the end of the day
    const endDuration = durationMin(lastEndTime, dayEnd);
    if (endDuration !== null && endDuration >= minGapMinutes) {
        gaps.push({ start: lastEndTime, end: dayEnd });
    }

    return gaps;
};
