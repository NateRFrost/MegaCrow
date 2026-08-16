/**
 * Node stdio/IPC entry for the Megacrow Megalo LSP.
 * Used by the VS Code extension language client.
 */
import {
  type Connection,
  createConnection,
  ProposedFeatures,
} from "vscode-languageserver/node";
import { startMegacrowLanguageServer } from "../createServer";

const connection: Connection = createConnection(ProposedFeatures.all);
startMegacrowLanguageServer(connection);
