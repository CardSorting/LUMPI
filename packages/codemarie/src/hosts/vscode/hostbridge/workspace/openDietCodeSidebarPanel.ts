import * as vscode from "vscode";
import { ExtensionRegistryInfo } from "@/registry";
import type { OpenDietCodeSidebarPanelRequest, OpenDietCodeSidebarPanelResponse } from "@/shared/proto/index.host";

export async function openDietCodeSidebarPanel(
	_: OpenDietCodeSidebarPanelRequest,
): Promise<OpenDietCodeSidebarPanelResponse> {
	await vscode.commands.executeCommand(`${ExtensionRegistryInfo.views.Sidebar}.focus`);
	return {};
}
