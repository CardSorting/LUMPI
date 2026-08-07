/**
 * [LAYER: CORE]
 * Bounded summaries for JoyRide execution artifacts.
 */
export interface JoyRideCommandOutputSummary {
    text: string;
    originalBytes: number;
    summaryBytes: number;
    truncated: boolean;
}
export declare function summarizeJoyRideCommandOutput(output: string, maxChars?: number): JoyRideCommandOutputSummary;
//# sourceMappingURL=summaries.d.ts.map