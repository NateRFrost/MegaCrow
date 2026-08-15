import { createNodeFilesystem } from "./nodeFilesystem";
import { runCli } from "./runCli";

runCli(process.argv.slice(2), createNodeFilesystem())
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
