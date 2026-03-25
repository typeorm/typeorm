# Cool Admin Midway

- **Repository**: https://github.com/cool-team-official/cool-admin-midway
- **Branch**: `8.x`
- **Commit**: `43b0e10`
- **TypeORM version**: `npm:@cool-midway/typeorm@0.3.20`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

7 files transformed successfully. The project uses a custom `npm:@cool-midway/typeorm@0.3.20` alias for the TypeORM package.

### Known issue

The dependency upgrade **crashed** with `TypeError: Invalid comparator: npm:@cool-midway/typeorm@0.3.20`. The `semver` library cannot parse npm alias version specifiers (`npm:` protocol). This is a bug in the codemod that needs to be fixed — non-standard version specifiers should be skipped gracefully.

### Parse errors

4 files failed to parse — likely TypeScript features unsupported by the Babel parser.

## Output

```
✔ Changed 7 out of 153 files (9m 55s), 4 errors
⠋ Upgrading dependencies in 2 package.json files...TypeError: Invalid comparator: npm:@cool-midway/typeorm@0.3.20
```
