// MegaloEdit Compiler Settings
export interface CompilerSettings {
  temporaryVariablesCanOverflowIntoUnusedGlobalVariables: boolean;
}

export const DEFAULT_COMPILER_SETTINGS: CompilerSettings = {
  temporaryVariablesCanOverflowIntoUnusedGlobalVariables: true,
};

export const resolveCompilerSettings = (
  partial?: Partial<CompilerSettings>
): CompilerSettings => ({
  ...DEFAULT_COMPILER_SETTINGS,
  ...partial,
});
