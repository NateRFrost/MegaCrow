/**
 * Browser web worker entry for the Megacrow Megalo LSP.
 * Starts the language server over BrowserMessageReader/Writer.
 */
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
} from "vscode-languageserver/browser";
import { startMegacrowLanguageServer } from "../createServer";

const reader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const writer = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);
const connection = createConnection(reader, writer);
startMegacrowLanguageServer(connection);
