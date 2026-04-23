# @typeorm/codemod

Automated code migration tool for TypeORM version upgrades.

## Usage

```bash
# Run all v1 transforms
npx @typeorm/codemod v1 src/

# Dry run (preview changes without writing)
npx @typeorm/codemod v1 --dry src/

# Run a specific transform
npx @typeorm/codemod v1 --transform connection-to-datasource src/

# Exclude files by glob pattern (repeatable)
npx @typeorm/codemod v1 --ignore '**/generated*' --ignore '**/e2e/**' src/

# Control parallelism
npx @typeorm/codemod v1 --workers 4 src/

# List available transforms
npx @typeorm/codemod v1 --list
```

## Options

| Option               | Short | Description                                                           |
| -------------------- | ----- | --------------------------------------------------------------------- |
| `--dry`              | `-d`  | Dry run (show changes without writing)                                |
| `--help`             | `-h`  | Show help                                                             |
| `--ignore <pattern>` | `-i`  | Additional glob pattern to exclude (repeatable; merged with defaults) |
| `--list`             | `-l`  | List available transforms                                             |
| `--transform <name>` | `-t`  | Run a specific transform only                                         |
| `--version`          | `-v`  | Print the installed `@typeorm/codemod` version                        |
| `--workers <num>`    | `-w`  | Number of worker processes (default: CPU cores - 1)                   |

`**/*.d.ts` is always excluded — ambient type declarations describe the shapes consumers rely on, and rewriting identifiers inside them would silently corrupt published types. User-provided `--ignore` patterns are merged on top of this default.

## After running

Some transforms leave `TODO` comments in your code where manual changes are needed. After the codemod completes, it will list all files that require manual review.

### Formatting

The codemod uses an AST-based approach which may introduce minor formatting differences (e.g. extra parentheses, quote style changes). Run your project's formatter after the codemod to restore your code style:

```bash
npx @typeorm/codemod v1 src/
npx prettier --write src/        # or: npx eslint --fix src/
```

### Scoping

Transforms that rename properties or methods (e.g. `.connection` to `.dataSource`) identify TypeORM instances through type annotations. They also recognize untyped class fields whose initializer is a known accessor chain (e.g. `private manager = this.dataSource.manager`). Code with no typing signal at all may not be transformed automatically — review `git diff` after running.

## Documentation

See the full upgrading guide for details on all breaking changes:

- [v1](https://typeorm.io/docs/releases/1.0/upgrading-from-0.3)
