import { ASTParameterNode } from "../../abstract-syntax-tree/parameters";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { CompilerError } from "../../../diagnostics/error";

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