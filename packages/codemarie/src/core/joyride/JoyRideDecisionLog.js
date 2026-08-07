/**
 * [LAYER: CORE]
 * Bounded in-process JoyRide decision log for no-UI diagnostics.
 */
const MAX_DECISION_LOG = 128;
const decisionLog = [];
export function recordJoyRideDecision(decision) {
    decisionLog.push(decision);
    if (decisionLog.length > MAX_DECISION_LOG) {
        decisionLog.splice(0, decisionLog.length - MAX_DECISION_LOG);
    }
}
export function getJoyRideDecisionLog(limit = 32) {
    return decisionLog.slice(-limit);
}
export function getLastJoyRideDecision() {
    return decisionLog[decisionLog.length - 1];
}
export function explainJoyRideDecision(auditEventId) {
    return decisionLog.find((d) => d.auditEventId === auditEventId);
}
export function clearJoyRideDecisionLog() {
    decisionLog.length = 0;
}
//# sourceMappingURL=JoyRideDecisionLog.js.map