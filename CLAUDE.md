# episki frameworks

GRC (Governance, Risk, and Compliance) framework definitions for [episki](https://github.com/episki). This is a **public repository** — do not commit secrets, credentials, or internal-only information.

## Project structure

```
frameworks/       JSON framework definitions (one file per framework)
framework.schema.json   JSON Schema (draft 2020-12) all frameworks must validate against
scripts/          Validation and build tooling (TypeScript, run with bun)
scf/              Secure Controls Framework data
logos/            Framework logo assets
```

## Setup

```sh
bun install
```

## Key commands

```sh
bun run frameworks:lint              # validate JSON formatting (strict, no changes)
bun run frameworks:lint:fix          # fix malformed JSON and normalize formatting
bun run frameworks:validate-schema   # validate all frameworks against framework.schema.json
bun run frameworks:check             # lint + schema validation together
bun run frameworks:minify            # minify framework JSON files
```

## Framework JSON format

Every file in `frameworks/` must conform to `framework.schema.json`. Key rules:

- **Required top-level fields**: `name`, `short_name`, `last_updated` (ISO 8601 date), `description`, `category`, `keywords`, `controls`
- **Optional top-level fields**: `version`, `publisher`, `source_url`, `effective_date`, `retired_date`
- **Controls are recursive**: each `controlNode` has a required `ref` field and optional `label`, `description`, `group`, `tags`, `mappings`, `source_url`, `controls` (children), and `tests`
- **`additionalProperties: false`** is enforced at every level — do not add custom fields to controlNode or testNode objects
- **Group nodes** use `"group": true` to indicate structural containers vs enforceable requirements
- **Nested controls** use the `controls` array to create parent-child hierarchies (e.g., dimension > subdimension > control)
- **Ref numbering**: use a hierarchical scheme matching the source framework (e.g., `1`, `1.1`, `1.1.1`). When the source has no refs, create a consistent numbering scheme

## Adding a new framework

1. Create a JSON file in `frameworks/` following the schema
2. Use existing frameworks as reference for structure and style
3. Run `bun run frameworks:check` to validate
4. Controls should be layered using nested `controls` arrays (not flat lists)

## Conventions

- Framework file names should be descriptive (e.g., `NIST CSF 2.0.json`, `PCI DSS 4.0.1.json`)
- `last_updated` should reflect when the JSON was last modified
- Descriptions should be concise but informative
- Keep `keywords` relevant for search/filtering
