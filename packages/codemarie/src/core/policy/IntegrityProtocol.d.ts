export interface StabilityDiagnostics {
    buildHealth: number;
    workloadLevel: string;
    buildErrors: string[];
    lintWarnings: string[];
    hotspots: string[];
    refactorTurns?: number;
    forensicVerified?: boolean;
    karmaStatus?: string;
    recursiveStabilization?: boolean;
    safetyGuard?: string;
    agenticThrashing?: {
        loop: boolean;
        doubtFiles: string[];
    };
    healthTrend?: number;
    fragilityIndex?: Record<string, number>;
    namingIntegrity?: number;
    activityLevel?: number;
    velocityMultiplier?: number;
    restorationActive?: boolean;
    neuralFocus?: string[];
    aestheticResilience?: number;
    recoveryHint?: string;
    projectVelocity?: number;
    syncDrift?: string;
    suggestedRepairs?: string[];
}
/**
 * IntegrityProtocol: Unified authority for Stability Drafting (V12).
 * Centralizes templates, validation rules, and diagnostic synthesis.
 */
export declare namespace IntegrityProtocol {
    const V12_ID = "CORE_V12";
    const GUIDANCE = "Keep building on this direction, verify and refine the details";
    const MANTRA = "Discipline ensures project health.";
    const HEADERS: {
        AUDIT: string;
        BREATH: string;
        AGILE: string;
        SOVEREIGN: string;
        ARCHITECT: string;
        CRITIC: string;
        SRE: string;
        RESOLUTION: string;
        DIAGNOSTICS: string;
    };
    const SEMANTIC_PATTERNS: {
        AUDIT: RegExp;
        ARCHITECT: RegExp;
        CRITIC: RegExp;
        SRE: RegExp;
        RESOLUTION: RegExp;
    };
    /**
     * V270: Broad Implicit Agility.
     * Most files are now considered agile-safe to prevent artificial blockers.
     */
    function isImplicitAgileSafe(filePath: string): boolean;
    /**
     * Generates a full Stability Audit template with optional diagnostics.
     */
    function generateAuditTemplate(taskName: string, diagnostics?: StabilityDiagnostics, forensicTrace?: string): string;
    /**
     * V320: Generates a lightweight Rapid Audit template for high-velocity turns.
     * Used for agile-safe layers or low-complexity tasks to minimize drafting overhead.
     */
    function generateRapidAuditTemplate(taskName: string): string;
    /**
     * V16: Generates a lightweight Stability Recalibration template for activity recovery.
     */
    function generateBreathTemplate(taskName: string, reason?: string): string;
}
//# sourceMappingURL=IntegrityProtocol.d.ts.map