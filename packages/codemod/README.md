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

### Formatting

The codemod uses an AST-based approach which may introduce minor formatting differences (e.g. extra parentheses, quote style changes). Run your project's formatter after the codemod to restore your code style, for example:

```bash
npx @typeorm/codemod v1 src/
npx eslint --fix src/
npx prettier --write src/
```

### Scoping

Transforms that rename properties or methods (e.g. `.connection` to `.dataSource`) rely on type annotations to identify TypeORM instances. Code that uses TypeORM APIs without type annotations may not be transformed automatically — review `git diff` after running.

## Documentation

See the full migration guide for details on all breaking changes:

- [v1](https://typeorm.io/docs/guides/migration-v1)
