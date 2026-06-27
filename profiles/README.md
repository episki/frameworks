# Profiles

Control **selections / tailorings** of the catalogs in `frameworks/`. A profile
picks (and optionally excludes) controls from one or more catalogs for a specific
context — e.g. a PCI DSS SAQ type, or a CSA CCM "lite" subset.

Selection is its own artifact and never lives inside a catalog: a catalog defines
what a framework *is*; a profile defines *which of it applies here*. This mirrors
the OSCAL Profile model.

Every file must validate against `../profile.schema.json` (run `bun run frameworks:check`).

## Shape

```json
{
  "key": "pci-saq-a-ep",
  "name": "PCI DSS v4.0.1 SAQ A-EP",
  "category": "profile",
  "last_updated": "2026-06-27",
  "imports": [
    { "catalog": "pci-dss-4-0-1", "include_controls": ["1.1", "1.2.1"] }
  ]
}
```

- **`imports[].catalog`** must match a `frameworks/*.json` `key`.
- Each import provides either **`include_controls`** (explicit refs) or
  **`include_all: true`** (optionally narrowed by **`exclude_controls`**).
- Control refs are written exactly as they appear in the target catalog.
