# @typeorm/codemod

Automated code migration tool for TypeORM version upgrades.

## Usage

```bash
# Run all v1 transforms
npx @typeorm/codemod v1 src/

# Dry run (preview changes without writing)
npx @typeorm/codemod v1 --dry src/

# Run a specific transform
npx @typeorm/codemod v1 --transform rename-find-by-ids src/

# List available transforms
npx @typeorm/codemod v1 --list
```

## After running

Some transforms leave `TODO` comments in your code where manual changes are needed. After the codemod completes, it will list all files that require manual review.

If you use an auto-formatter like Prettier, run it after the codemod to restore your code style.

## Docmentation

See the full migration guides for details on all breaking changes:

- [v1](https://typeorm.io/docs/guides/migration-v1)
