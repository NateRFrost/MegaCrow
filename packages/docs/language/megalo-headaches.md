# Megalo Headaches

These are oddities in Megalo causing unexpected behaviour which you may encounter when authoring gametypes.

## 1. Broken Variable Shadowing

MegaloEdit allows you to define variables with duplicate names, but some variable types ALWAYS reference the first declared, meaning later declarations are silently impossible to reference and waste space in your gametype.

### Affected (first declaration wins)

Redeclaring the same name keeps the **first** declaration for name lookup. Later declarations still take a slot but are ignored when resolving references.

**Variables**

| Scope | Types |
|-------|--------|
| `variables global` | `timer` only |
| `variables player` | `number`, `timer`, `object`, `player`, `team` |
| `variables team` | `number`, `timer`, `object`, `player`, `team` |
| `variables object` | `number`, `timer`, `object`, `player`, `team` |

**Named declarations** (same append + `FindIndex` pattern)

| Element | Names |
|---------|--------|
| `map_object` | filter name |
| `game_options` | `option` / `ranged_option` name |
| `game_options` | `player_traits` recipient name |
| `game_stats` | stat name |
| `hud_widgets` | widget name |
| `loadout` | loadout name |
| `loadout_palette` | palette name |
| `requisition_palette` | palette name |

```megalo
variables global
	networked timer shared_timer 5
	networked timer shared_timer 99   ; slot taken, but name still means the first
end

variables player
	local number flag 0
	local number flag 1               ; same: first `flag` wins
end

map_object shared_filter
	label "first"
end
map_object shared_filter
	label "second"                    ; slot taken; references resolve to the first
end
```

### Not affected (last declaration wins)

These use `FindLastIndex`, so a later declaration with the same name correctly shadows the earlier one for name lookup (both still consume slots).

| Scope | Types |
|-------|--------|
| `variables global` | `number`, `object`, `player`, `team` |
| temporary variables | all types (`temporary` in a trigger) |

```megalo
variables global
	local number counter 0
	local number counter 7            ; references resolve to this one
end
```

Strings are a different case: MegaloEdit **errors** on a duplicate string name in the same language rather than shadowing.

## 2. Inaccessible `target_team`

The engine exposes an explicit team slot for the team that owns [`target_player`](/language/references#context-references) (`ExplicitTeam.TargetTeam` on the wire). MegaloEdit’s autocomplete even lists `target_team`, but its team parser only accepts `local_team` for the HUD local-player owner team — it never matches `target_team` (or the older alias `hud_target_player_owner_team`).

So in MegaloEdit you cannot write:

```megalo
action set some_team set_to target_team
```

The reference is a dead keyword: present in autocomplete and in the binary encoding, absent from parse.

## 3. Inaccessible `coop spawning` navpoint icon

`navpoint_set_icon`’s name table includes a final entry whose string is literally **`coop spawning`** (with a space).

MegaloEdit resolves icon names with `read_enumerated_string`, which consumes **one** identifier token and compares it to each table string. A single token can never equal `"coop spawning"`, so the icon is impossible to write:

```megalo
action navpoint_set_icon marker coop spawning   ; never matches
```
