declare module "@monaco-themes/*.json" {
  const theme: {
    base: "vs" | "vs-dark" | "hc-black";
    inherit: boolean;
    rules: Array<{
      token: string;
      foreground?: string;
      background?: string;
      fontStyle?: string;
    }>;
    colors: Record<string, string>;
  };
  export default theme;
}
