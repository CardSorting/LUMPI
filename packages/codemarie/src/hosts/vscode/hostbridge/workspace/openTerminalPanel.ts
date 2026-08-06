import * as vscode from "vscode";
import type { OpenTerminalRequest, OpenTerminalResponse } from "@/shared/proto/index.host";

export async function openTerminalPanel(_: OpenTerminalRequest): Promise<OpenTerminalResponse> {
	vscode.commands.executeCommand("workbench.action.terminal.focus");
	return {};
}
