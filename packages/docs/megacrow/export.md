# Export

Use **Export** in the toolbar to compile the current Megalo gametype and save it in a chosen binary format. Pick a format from the **Export as** menu.

All formats are produced from the same compiled variant; only the container and intended use differ.

## Formats

### `.mglo`

**Best for:** hot reload and HREK / MCC `maps/megalo` workflows.

- Smallest custom-variant payload (raw Megalo bitstream)
- Drop into your workspace **output folder** (usually `maps/megalo`) for debug / developer reload
- Does not wrap the variant in a full BLF document

Use this when iterating on a script and loading it from the game's megalo maps directory.

### `gvar`

**Best for:** Xbox 360 matchmaking / debug net commands.

- BLF wrapper aimed at Xbox 360 matchmaking-style loading
- In debug builds, load with `net_load_and_use_game_variant`
- Larger than `.mglo` because of BLF framing

Prefer `gvar` when you specifically need the 360 matchmaking BLF path rather than File Share or MCC save formats.

### `mpvr`

**Best for:** standard in-game saves, File Share, and Xbox / PC gametype files.

- Standard BLF packaging for Reach custom variants
- Suitable for saving in-game, uploading to File Share, and sharing across Xbox / PC workflows
- The usual “full” gametype file people exchange

Choose `mpvr` when you want a normal shareable / loadable gametype file rather than a raw `.mglo` bitstream.

### Autosave Queue (`asq`)

**Best for:** appearing under **Recent Games** via the autosave queue.

- Writes an Autosave Queue file instead of a standalone variant drop-in
- Place the file where your game expects autosave-queue content so the gametype shows up in Recent Games
- Useful for testing without going through File Share or manual `maps/megalo` copy for every load path

## Choosing a format

| Goal | Format |
|------|--------|
| Fastest iterate in `maps/megalo` | `.mglo` |
| 360 debug `net_load_and_use_game_variant` | `gvar` |
| File Share / normal saves / cross-platform | `mpvr` |
| Recent Games via autosave queue | Autosave Queue |

Export uses your current [Settings](/megacrow/settings) (author name, compiler profile, strict compiler) when compiling.
