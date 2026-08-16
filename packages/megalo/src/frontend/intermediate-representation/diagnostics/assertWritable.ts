import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  isWritableCustomTimer,
  isWritableCustomVariable,
  isWritableObjectReference,
  isWritablePlayerReference,
  isWritableTeamReference,
  isWritableVariantVariable,
} from "src/frontend/intermediate-representation/diagnostics/isWritable";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type {
  CustomTimerReference,
  CustomVariableReference,
  ObjectReference,
  PlayerReference,
  TeamReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  type VariantVariable,
  VariableType as VariantVariableType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";

export const assertWritableObject = (
  ref: ObjectReference,
  location: SourceCodeLocation
): void => {
  if (!isWritableObjectReference(ref)) {
    throw new LowerError(
      diagnosticMessages.objectReferenceMustBeWritable(),
      location
    );
  }
};

export const assertWritablePlayer = (
  ref: PlayerReference,
  location: SourceCodeLocation
): void => {
  if (!isWritablePlayerReference(ref)) {
    throw new LowerError(
      diagnosticMessages.playerReferenceMustBeWriteable(),
      location
    );
  }
};

export const assertWritableTeam = (
  ref: TeamReference,
  location: SourceCodeLocation
): void => {
  if (!isWritableTeamReference(ref)) {
    throw new LowerError(
      diagnosticMessages.teamReferenceMustBeWriteable(),
      location
    );
  }
};

export const assertWritableNumeric = (
  ref: CustomVariableReference,
  location: SourceCodeLocation
): void => {
  if (!isWritableCustomVariable(ref)) {
    throw new LowerError(
      diagnosticMessages.numericReferenceMustBeWriteable(),
      location
    );
  }
};

export const assertWritableTimer = (
  ref: CustomTimerReference,
  location: SourceCodeLocation
): void => {
  if (!isWritableCustomTimer(ref)) {
    throw new LowerError(
      diagnosticMessages.numericReferenceMustBeWriteable(),
      location
    );
  }
};

export const assertWritableVariant = (
  ref: VariantVariable,
  location: SourceCodeLocation
): void => {
  if (isWritableVariantVariable(ref)) {
    return;
  }
  switch (ref.type) {
    case VariantVariableType.CustomVariable:
      throw new LowerError(
        diagnosticMessages.numericReferenceMustBeWriteable(),
        location
      );
    case VariantVariableType.Player:
      throw new LowerError(
        diagnosticMessages.playerReferenceMustBeWriteable(),
        location
      );
    case VariantVariableType.Object:
      throw new LowerError(
        diagnosticMessages.objectReferenceMustBeWritable(),
        location
      );
    case VariantVariableType.Team:
      throw new LowerError(
        diagnosticMessages.teamReferenceMustBeWriteable(),
        location
      );
    case VariantVariableType.CustomTimer:
      throw new LowerError(
        diagnosticMessages.numericReferenceMustBeWriteable(),
        location
      );
  }
};
