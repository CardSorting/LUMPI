export interface RecoveryContext {
	toolName: string;
	errorType: "schema_mismatch" | "tool_execution_failed" | "subagent_error";
	errorMessage: string;
	attemptCount: number;
}

export class StructuredRecoveryEngine {
	private maxAttempts: number;

	constructor(maxAttempts: number = 3) {
		this.maxAttempts = maxAttempts;
	}

	public generateRecoveryHint(ctx: RecoveryContext): string | null {
		if (ctx.attemptCount >= this.maxAttempts) {
			return null;
		}

		if (ctx.errorType === "schema_mismatch") {
			return [
				`[STRUCTURED RECOVERY HINT: Schema Mismatch in '${ctx.toolName}']`,
				`The arguments passed to tool '${ctx.toolName}' did not match the expected parameter schema.`,
				`Details: ${ctx.errorMessage}`,
				`Please verify property names, required fields, and types before retrying.`,
			].join("\n");
		}

		if (ctx.errorType === "subagent_error") {
			return [
				`[STRUCTURED RECOVERY HINT: Subagent Failure]`,
				`Subagent execution failed with error: ${ctx.errorMessage}`,
				`Review subagent prompt constraints and consider breaking the assignment into smaller tasks.`,
			].join("\n");
		}

		return [
			`[STRUCTURED RECOVERY HINT: Tool Execution Failed]`,
			`Tool '${ctx.toolName}' encountered a runtime error: ${ctx.errorMessage}`,
			`Check path existence, file permissions, or command syntax before retrying.`,
		].join("\n");
	}
}
