import { e_explicit_object_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";

const EXPLICIT_OBJECT_TYPE_TO_BLF = {
  [ExplicitObject.None]: e_explicit_object_type.no_object,
  [ExplicitObject.Global0]: e_explicit_object_type.global_0,
  [ExplicitObject.Global1]: e_explicit_object_type.global_1,
  [ExplicitObject.Global2]: e_explicit_object_type.global_2,
  [ExplicitObject.Global3]: e_explicit_object_type.global_3,
  [ExplicitObject.Global4]: e_explicit_object_type.global_4,
  [ExplicitObject.Global5]: e_explicit_object_type.global_5,
  [ExplicitObject.Global6]: e_explicit_object_type.global_6,
  [ExplicitObject.Global7]: e_explicit_object_type.global_7,
  [ExplicitObject.Global8]: e_explicit_object_type.global_8,
  [ExplicitObject.Global9]: e_explicit_object_type.global_9,
  [ExplicitObject.Global10]: e_explicit_object_type.global_10,
  [ExplicitObject.Global11]: e_explicit_object_type.global_11,
  [ExplicitObject.Global12]: e_explicit_object_type.global_12,
  [ExplicitObject.Global13]: e_explicit_object_type.global_13,
  [ExplicitObject.Global14]: e_explicit_object_type.global_14,
  [ExplicitObject.Global15]: e_explicit_object_type.global_15,
  [ExplicitObject.Current]: e_explicit_object_type.current,
  [ExplicitObject.HudTarget]: e_explicit_object_type.hud_target,
  [ExplicitObject.Killed]: e_explicit_object_type.killed,
  [ExplicitObject.Killer]: e_explicit_object_type.killer,
  [ExplicitObject.Unknown21]: e_explicit_object_type.unknown_21,
  [ExplicitObject.Temporary0]: e_explicit_object_type.temporary_0,
  [ExplicitObject.Temporary1]: e_explicit_object_type.temporary_1,
  [ExplicitObject.Temporary2]: e_explicit_object_type.temporary_2,
  [ExplicitObject.Temporary3]: e_explicit_object_type.temporary_3,
  [ExplicitObject.Temporary4]: e_explicit_object_type.temporary_4,
  [ExplicitObject.Temporary5]: e_explicit_object_type.temporary_5,
  [ExplicitObject.Temporary6]: e_explicit_object_type.temporary_6,
  [ExplicitObject.Temporary7]: e_explicit_object_type.temporary_7,
} as const satisfies Record<ExplicitObject, e_explicit_object_type>;

export const encodeExplicitObjectType = (
  value: ExplicitObject
): e_explicit_object_type => EXPLICIT_OBJECT_TYPE_TO_BLF[value];
