/**
 * Codemarie Agent Core Controller & Host Provider Integration
 */

export { HostProvider } from "./hosts/host-provider.js";
export {
	initializeCliHostProvider,
	CliWorkspaceClient,
	CliEnvClient,
	CliWindowClient,
	CliDiffClient,
} from "./hosts/cli/cli-host-provider.js";
