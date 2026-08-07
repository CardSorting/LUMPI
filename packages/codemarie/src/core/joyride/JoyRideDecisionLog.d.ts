/**
 * [LAYER: CORE]
 * Bounded in-process JoyRide decision log for no-UI diagnostics.
 */
import type { JoyRideCacheDecision } from "./JoyRideDecisions";
export declare function recordJoyRideDecision(decision: JoyRideCacheDecision): void;
export declare function getJoyRideDecisionLog(limit?: number): readonly JoyRideCacheDecision[];
export declare function getLastJoyRideDecision(): JoyRideCacheDecision | undefined;
export declare function explainJoyRideDecision(auditEventId: string): JoyRideCacheDecision | undefined;
export declare function clearJoyRideDecisionLog(): void;
//# sourceMappingURL=JoyRideDecisionLog.d.ts.map