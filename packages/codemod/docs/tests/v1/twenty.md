# Twenty

- **Repository**: https://github.com/twentyhq/twenty
- **Branch**: `main`
- **Commit**: `fb34d2c`
- **TypeORM version**: `patch:typeorm@0.3.20`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

198 files transformed out of 15,240 — Twenty is a large CRM monorepo using a patched TypeORM v0.3.20.

### Known issue

The dependency upgrade **crashed** with `TypeError: Invalid comparator: patch:typeorm@0.3.20#./patches/typeorm`. The `semver` library cannot parse Yarn patch protocol version specifiers. Same bug as `cool-admin-midway` — non-standard version specifiers need graceful handling.

### Parse errors

1 file failed to parse. Given the massive codebase (15k+ files), this is an excellent success rate.

_Note: detailed transform breakdown was lost due to the dependency crash interrupting the output._

## Output

```
✔ Changed 198 out of 15240 files (4m 30s), 1 errors
⠋ Upgrading dependencies in 38 package.json files...TypeError: Invalid comparator: patch:typeorm@0.3.20#./patches/typeorm
```
