import { CompilerError } from "src/diagnostics/error";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";

export const expectParameterCount = (
  count: number,
  parameters: ASTParameterNode[]
) => {
  if (parameters.length !== count) {
    // TODO: finalize copy
    throw new CompilerError(
      diagnosticMessages.invalidParameterCount(count, parameters.length),
      parameters[0].location
    );
  }
};
