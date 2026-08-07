import { Type } from "typebox";
import { defineTool, type ToolDefinition } from "../../../core/extensions/types.ts";
import * as git from "../../../utils/git.ts";
import { validateAnalysis } from "../../analysis/validation.ts";
import type { CommitType, ConventionalAnalysis, ConventionalDetail } from "../../types.ts";
import { normalizeDetails } from "../../utils.ts";
import type { CommitAgentState } from "../state.ts";
import {
	capDetails,
	MAX_DETAIL_ITEMS,
	normalizeSummary,
	SUMMARY_MAX_CHARS,
	validateSummaryRules,
	validateTypeConsistency,
} from "../validation.ts";
import { commitTypeSchema, detailSchema } from "./schemas.ts";

const proposeCommitSchema = Type.Object({
	type: commitTypeSchema,
	scope: Type.Union([Type.String(), Type.Null()]),
	summary: Type.String(),
	details: Type.Array(detailSchema),
	issue_refs: Type.Array(Type.String()),
});

interface ProposalResponse {
	valid: boolean;
	errors: string[];
	warnings: string[];
	proposal?: {
		type: CommitType;
		scope: string | null;
		summary: string;
		details: ConventionalDetail[];
		issue_refs: string[];
	};
}

export function createProposeCommitTool(
	cwd: string,
	state: CommitAgentState,
): ToolDefinition<typeof proposeCommitSchema> {
	return defineTool({
		name: "propose_commit",
		label: "Propose Commit",
		description: "Submit the final conventional commit proposal.",
		parameters: proposeCommitSchema,
		async execute(_toolCallId, params) {
			const scope = params.scope?.trim() || null;
			const summary = normalizeSummary(params.summary, params.type, scope);
			const details = normalizeDetails(params.details);
			const { details: cappedDetails, warnings: detailWarnings } = capDetails(details);
			const analysis: ConventionalAnalysis = {
				type: params.type,
				scope,
				details: cappedDetails,
				issueRefs: params.issue_refs ?? [],
			};

			const summaryValidation = validateSummaryRules(summary);
			const analysisValidation = validateAnalysis(analysis);
			const stagedFiles = state.overview?.files ?? (await git.diff.changedFiles(cwd, { cached: true }));
			const diffText = state.diffText ?? (await git.diff(cwd, { cached: true }));
			const typeValidation = validateTypeConsistency(params.type, stagedFiles, {
				diffText,
				summary,
				details: cappedDetails,
			});

			const errors = [...summaryValidation.errors, ...analysisValidation.errors, ...typeValidation.errors];
			const warnings = [...summaryValidation.warnings, ...detailWarnings, ...typeValidation.warnings];

			const response: ProposalResponse = {
				valid: errors.length === 0,
				errors,
				warnings,
			};

			if (response.valid) {
				response.proposal = {
					type: analysis.type,
					scope: analysis.scope,
					summary,
					details: analysis.details,
					issue_refs: analysis.issueRefs,
				};
				state.proposal = {
					analysis,
					summary,
					warnings,
				};
			}

			const text = JSON.stringify(
				{
					...response,
					constraints: {
						maxSummaryChars: SUMMARY_MAX_CHARS,
						maxDetailItems: MAX_DETAIL_ITEMS,
					},
				},
				null,
				2,
			);

			return {
				content: [{ type: "text", text }],
				details: response,
			};
		},
	});
}
