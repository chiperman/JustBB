export interface HeatmapStats {
    totalMemos: number;
    totalTags: number;
    firstMemoDate: string | null;
    days: Record<string, { count: number; wordCount: number }>;
}

export interface TimelineStats {
    days: Record<string, { count: number; wordCount: number }>;
}
