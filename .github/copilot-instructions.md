# GitHub Copilot Instructions for TypeORM

This document provides guidance for GitHub Copilot when working with the TypeORM codebase.

## Project Overview

TypeORM is a TypeScript-based Object-Relational Mapping (ORM) library that supports multiple databases including MySQL/MariaDB, PostgreSQL, MS SQL Server, Oracle, SAP HANA, SQLite, MongoDB, and Google Spanner. It implements both Active Record and Data Mapper patterns and runs on Node.js, Browser, React Native, and Electron platforms.

## Architecture & Structure

### Core Components

- **`src/data-source/`** - DataSource (formerly Connection) management
- **`src/entity-manager/`** - Entity management and operations
- **`src/repository/`** - Repository pattern implementation
- **`src/query-builder/`** - SQL query building
- **`src/decorator/`** - TypeScript decorators for entities, columns, relations
- **`src/driver/`** - Database-specific drivers
- **`src/metadata/`** - Entity metadata management
- **`src/schema-builder/`** - Schema creation and migration
- **`src/migration/`** - Database migration system
- **`src/subscriber/`** - Event subscriber system
- **`src/persistence/`** - Entity persistence logic

### Design Patterns

- **Active Record Pattern**: Entities have methods to save, remove, and query themselves
- **Data Mapper Pattern**: Repositories handle entity persistence separately from business logic
- **Decorator Pattern**: Extensive use of TypeScript decorators for metadata definition
- **Builder Pattern**: QueryBuilder for constructing complex queries

## Coding Standards

### TypeScript Configuration

- Target: ES2021+ with CommonJS modules
- Decorators: `experimentalDecorators` and `emitDecoratorMetadata` enabled

### Code Style

- **Formatting**: Use Prettier with these settings:
    - No semicolons (`"semi": false`)
- **Linting**: ESLint with TypeScript support
    - Use `@typescript-eslint` rules
    - Warnings allowed for some `@typescript-eslint/no-*` rules
    - Unused variables starting with `_` are ignored
- **Naming Conventions**:
    - Classes: PascalCase (e.g., `DataSource`, `EntityManager`)
    - Interfaces: PascalCase (e.g., `ColumnOptions`, `RelationOptions`)
    - Variables/functions: camelCase
    - Constants: UPPER_SNAKE_CASE for true constants
    - Private members: Use standard camelCase (no underscore prefix)

### TypeScript Patterns

- Use explicit types for public APIs
- Prefer interfaces over type aliases for object shapes
- Use generics for reusable components
- Avoid `any` where possible; use `unknown` or proper types
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators
- Leverage TypeScript utility types (`Partial<T>`, `Required<T>`, `Pick<T>`, etc.)

## Testing

### Test Structure

Tests are organized in `test/` directory:

- **`test/functional/`** - Feature and integration tests organized by functionality (preferred)
- **`test/github-issues/`** - Tests for specific GitHub issues
- **`test/unit/`** - Unit tests for individual components
- **`test/utils/`** - Test utilities and helpers

**Note**: Prefer writing functional tests over per-issue tests.

### Test Writing Guidelines

1. **Use the standard test template**:

```typescript
import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"

describe("description of functionality", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should do something specific", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Test implementation
            }),
        ))
})
```

2. **Test Configuration**:
    - Tests run against multiple databases (as configured in `ormconfig.json`)
    - Each test should work across all supported databases unless database-specific
    - Place entity files in `./entity/` relative to test file for automatic loading
    - Use `Promise.all(dataSources.map(...))` pattern to test against all databases

3. **Test Naming**:
    - Use descriptive `describe()` blocks for features
    - Use "should..." format for `it()` descriptions
    - Reference GitHub issue numbers when fixing specific issues

4. **Running Tests**:
    - Full test suite: `pnpm run test` (compiles then runs tests)
    - Fast iteration: `pnpm run test:fast` (runs without recompiling)
    - Specific tests: `pnpm run test:fast -- --grep "pattern"`
    - Watch mode: `pnpm run compile -- --watch` + `pnpm run test:fast`

## Database-Specific Considerations

### Multi-Database Support

When writing code or tests:

- Ensure compatibility across all supported databases
- Use driver-specific code only in `src/driver/` directory
- Test database-agnostic code against multiple databases
- Use `DataSource.options.type` to check database type when needed
- Be aware of SQL dialect differences (LIMIT vs TOP, etc.)

### Driver Implementation

Each driver in `src/driver/` implements common interfaces:

- Connection management
- Query execution
- Schema synchronization
- Type mapping
- Transaction handling

## Common Development Tasks

### Adding a New Feature

1. Create entities in appropriate test directory
2. Write tests first (TDD approach encouraged)
3. Implement feature in `src/`
4. Ensure tests pass across all databases
5. Update documentation if public API changes
6. Follow commit message conventions

### Adding a New Decorator

1. Create decorator file in `src/decorator/`
2. Create metadata args in `src/metadata-args/`
3. Update metadata builder in `src/metadata-builder/`
4. Export from `src/index.ts`
5. Add comprehensive tests
6. Update TypeScript type definitions if needed

### Working with Migrations

- Migrations are in `src/migration/`
- Migration files should be timestamped
- Support both up and down migrations
- Test migrations against all supported databases
- Ensure schema changes are reversible

## Build & Development Workflow

### Commands

- **Build**: `pnpm run compile` - Compiles TypeScript to `build/compiled/`
- **Package**: `pnpm run package` - Creates distribution in `build/package/`
- **Pack**: `pnpm pack` - Creates `.tgz` file in `build/`
- **Test**: `pnpm run test` - Compile and run all tests
- **Lint**: `pnpm run lint` - Run ESLint
- **Format**: `pnpm run format` - Run Prettier
- **Watch**: `pnpm run watch` - Watch mode for TypeScript compilation

### Development Setup

1. Install dependencies: `pnpm install`
2. Copy config: `cp ormconfig.sample.json ormconfig.json`
3. Configure database connections in `ormconfig.json`
4. Optionally use Docker: `docker compose up` for database services

### Pre-commit Hooks

- Husky runs pre-commit hooks
- Lint-staged runs on staged files
- Format and lint checks must pass

## Contribution Guidelines

### Commit Message Format

Follow conventional commits:

```
<type>: <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `chore`, `revert`

**Subject**:

- Use imperative, present tense
- Don't capitalize first letter
- No period at the end
- Max 100 characters per line

### Pull Request Requirements

- All tests must pass
- Include appropriate tests for changes
- Follow existing code style
- Update documentation for API changes
- Reference related GitHub issues
- Get approval before merging

## Common Patterns & Idioms

### Entity Definition

```typescript
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Photo, (photo) => photo.user)
    photos: Photo[]
}
```

### Repository Usage

```typescript
const userRepository = dataSource.getRepository(User)
const user = await userRepository.findOne({ where: { id: 1 } })
```

### QueryBuilder

```typescript
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo")
    .where("user.name = :name", { name: "John" })
    .getMany()
```

### Transactions

```typescript
await dataSource.transaction(async (manager) => {
    await manager.save(user)
    await manager.save(photo)
})
```

## Important Notes

- Always import `reflect-metadata` before TypeORM
- Be careful with circular dependencies between entities
- Use lazy relations or forward references for circular entity references
- Connection pooling is handled automatically by drivers
- Be mindful of N+1 query problems; use joins or eager loading
- Repository methods are async; always use `await`
- Entity instances should be plain objects, not class instances with methods (Data Mapper pattern)

## Resources

- [Main Documentation](https://typeorm.io)
- [Contributing Guide](../CONTRIBUTING.md)
- [Developer Guide](../DEVELOPER.md)
- [GitHub Repository](https://github.com/typeorm/typeorm)
- [Issue Tracker](https://github.com/typeorm/typeorm/issues)
