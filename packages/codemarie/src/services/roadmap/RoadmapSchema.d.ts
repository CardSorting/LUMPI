export declare const REQUIRED_SECTIONS: readonly ["1. Project Center of Gravity", "2. Roadmap Health", "3. Strategic Narrative", "4. Now", "5. Next", "6. Later", "7. Discovery", "8. Maintenance Gravity", "9. Centralization & Code Soup Audit", "10. Decision Log", "11. Recent Checkpoint", "12. Archive"];
export declare const HEALTH_STATUSES: Set<string>;
export declare const SOUP_RISK_LEVELS: Set<string>;
export declare const GRAVITY_IMPACTS: Set<string>;
export declare const CENTRALIZATION_EFFECTS: Set<string>;
export declare const ENTROPY_RISKS: Set<string>;
export declare const BOOTSTRAP_PLACEHOLDER_PHRASES: string[];
export interface ValidationIssue {
    severity: "error" | "warning";
    code: string;
    message: string;
    section?: string;
}
export interface RoadmapValidation {
    valid: boolean;
    schema_complete: boolean;
    health_status?: string;
    code_soup_risk?: string;
    now_item_count: number;
    issues: ValidationIssue[];
}
export declare function findBootstrapPlaceholders(content: string): ValidationIssue[];
export declare function getSectionBody(content: string, sectionTitle: string): string;
export declare function validateRoadmapContent(content: string): RoadmapValidation;
export declare function bootstrapSkeleton(params: {
    project_hint?: string;
    strategic_narrative?: string;
    operators_hint?: string;
    canonical_architecture?: string;
    canonical_workflows?: string;
    runtime_center?: string;
    anti_goals?: string;
    health_summary?: string;
    now_section?: string;
    checkpoint_next_move?: string;
    code_soup_risk?: string;
    centralization_recommendation?: string;
    recent_git_summary?: string;
    changed_files?: string[];
}): string;
//# sourceMappingURL=RoadmapSchema.d.ts.map