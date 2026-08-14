# engine_data

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

Metadata shown in the gametype browser.

```megalo
engine_data
	name slayer_title
	description slayer_description
	icon k_engine_icon_slayer
	category slayer
end
```

| Field | Purpose |
|-------|---------|
| `name` | String table symbol for the gametype title |
| `description` | String table symbol for the description |
| `icon` | Engine icon constant (e.g. `k_engine_icon_slayer`) |
| `category` | Short [engine category](/language/enums/engine-categories) name (e.g. `slayer`); see below |

Values are string table symbol names, not literal quoted strings — except `category`, which uses a prefixed lookup.

<DocsBlock type="info" title="Variant name and description">

The gametype `name` and `description` are stored separately to regular strings, because of this they do not count towards your gametype's strings count or size limit.

</DocsBlock>

<DocsBlock type="note" title="Category Weirdness">

`category` is unlike other Megalo fields. It corresponds to both a built-in [engine category](/language/enums/engine-categories) enum and a localized string-table label.

Writing `category slayer` resolves the string table symbol `engine_category_slayer` (not `slayer`). That prefixed symbol is usually defined in a shared include such as `strings/engine_category_strings.txt`:

```megalo
string_table english
	engine_category_slayer "Slayer"
	engine_category_vip "VIP"
	; …
end
```

</DocsBlock>

## Base-derived scripts

`engine_data` can appear in [base-derived scripts](/language/base-files) to override the inherited gametype metadata.
