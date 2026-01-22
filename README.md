## episki frameworks

Holding place for all the frameworks used for episki GRC.

### Tasks

Install tooling:

```sh
bun install
```

Run helpers:

```sh
# validate JSON formatting (strict JSON, no changes)
bun run frameworks:lint

# fix malformed JSON (e.g. trailing commas) and normalize formatting
bun run frameworks:lint:fix

# minify framework JSON files
bun run frameworks:minify

# validate frameworks against framework.schema.json
bun run frameworks:validate-schema
```
