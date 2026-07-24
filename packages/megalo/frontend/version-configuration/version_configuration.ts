import type { VariableLimits } from "./variables";

export abstract class VersionConfiguration {
  public abstract get limits(): VariableLimits;
}
