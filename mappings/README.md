# Mappings

**Crosswalks** between catalogs in `frameworks/`. A mapping collection relates the
controls of one *source* catalog to controls in one or more *target* catalogs.

Crosswalks are their own artifact and never live inside a catalog. This mirrors the
OSCAL Control Mapping model.

Every file must validate against `../mapping.schema.json` (run `bun run frameworks:check`).

## Shape

```json
{
  "key": "episki-ai-governance-crosswalks",
  "source_catalog": "episki-ai-governance",
  "last_updated": "2026-06-27",
  "mappings": [
    {
      "target_catalog": "aicpa-tsc-soc-2",
      "maps": [
        { "source": ["AI-GOV-001"], "target": ["CC6.1"], "relationship": "intersects-with" }
      ]
    }
  ]
}
```

- **`source_catalog`** / **`target_catalog`** must match `frameworks/*.json` keys.
- **`source`** / **`target`** are arrays of control refs (as written in their
  catalogs), so many-to-many crosswalks are expressible.
- **`relationship`** is set-theoretic — `equal`, `equivalent-to`, `subset-of`,
  `superset-of`, `intersects-with`. Use `intersects-with` (loosest) when unsure.
  These compose through a hub catalog (e.g. SCF) by *weakest link*.
- **`provenance`** (`curated` | `scf` | `derived-via-scf`) records where a mapping
  came from; hand-authored files default to `curated`.

## SCF as the mapping hub

Most pairwise crosswalks should **not** be hand-authored here. Each framework's
mapping to SCF (the hub) is loaded from SCF's own crosswalk data, and pairwise
A→B mappings are *derived* by joining A→SCF→B. Author files here only for
episki-native source catalogs (e.g. `episki-ai-governance`) and for curated
overrides where a precise relationship beats the derived one.
