import { type ClientCommandContext, clientCommand } from "./commands/client.ts";
import { lumiCommand, type PiCommandContext, piCommand } from "./commands/pi.ts";
import { type ServerCommandContext, serverCommand } from "./commands/server.ts";

export type ExperimentalCliContext = PiCommandContext & ServerCommandContext & ClientCommandContext;

export const experimentalCli = piCommand.command(lumiCommand).command(serverCommand).command(clientCommand);
