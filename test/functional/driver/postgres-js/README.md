# PostgreSQL.js Driver Tests for TypeORM

This directory contains comprehensive unit tests for the postgres.js driver implementation in TypeORM.

## Test Files

### 1. `connection-options.test.ts` (7 test suites, 20+ tests)

Tests for connection setup and configuration:

- **Connection Options**
    - Successfully establish connection
    - Set session variable `application_name`
    - Disable custom extension installation when not specified

- **Custom Extension Installation**
    - Install specified extensions (`tablefunc`, `xml2`) after connection

- **Basic Queries**
    - Execute SELECT queries
    - Handle parameterized queries
    - Execute multiple queries in sequence
    - Get server version
    - Get current database name
    - Get schema information

- **Transaction Handling**
    - Execute transactions with commit
    - Execute transactions with rollback
    - Support nested transactions via savepoints

- **Query Runner**
    - Create and release query runners
    - Reuse query runner for multiple queries
    - Support isolation levels in transactions

- **Data Types**
    - Handle various data types (INTEGER, TEXT, BOOLEAN, NUMERIC, TIMESTAMP)
    - Handle NULL values
    - Handle arrays
    - Handle JSON/JSONB types

- **Driver Properties**
    - Verify correct driver metadata (tree support, transaction support, parameters prefix)
    - Verify supported upsert types
    - Verify CTE capabilities
    - Verify replication status

### 2. `entity-operations.test.ts` (2 test suites, 30+ tests)

Tests for ORM entity operations and query builder:

- **Entity Operations**
    - Create table for entity
    - Insert entity
    - Retrieve entity by ID
    - Update entity
    - Delete entity
    - Count entities
    - Find all entities
    - Batch operations

- **Query Builder Operations**
    - Basic select queries
    - WHERE conditions
    - ORDER BY
    - LIMIT and OFFSET (pagination)
    - Aggregation functions (COUNT, AVG, MAX, MIN)
    - GROUP BY
    - Complex queries with multiple filters

### 3. `advanced-features.test.ts` (1 test suite, 20+ tests)

Tests for advanced PostgreSQL features:

- **SQL Features**
    - RETURNING clause in INSERT
    - CASE expressions
    - Window functions (ROW_NUMBER, etc.)
    - Common Table Expressions (CTEs)
    - UNION operations
    - CROSS JOIN
    - DISTINCT
    - Subqueries

- **Parameter Handling**
    - Large parameter sets (100+ parameters)
    - Special characters in strings
    - Zero values handling
    - Very long queries

- **Built-in Functions**
    - String functions (UPPER, LOWER)
    - Date/time functions (CURRENT_DATE, DATE_TRUNC)
    - Math functions (ABS, ROUND, CEIL)
    - COALESCE function
    - NULLIF function

- **Edge Cases**
    - Empty result sets
    - NULL handling in various contexts

## Running the Tests

### Prerequisites

1. Ensure postgres.js is installed:

```bash
pnpm add postgres
```

2. Configure the test database in `ormconfig.json`:

```json
{
    "skip": false,
    "name": "postgres-js",
    "type": "postgres-js",
    "host": "localhost",
    "port": 5432,
    "username": "test",
    "password": "test",
    "database": "test",
    "logging": false
}
```

3. Ensure PostgreSQL is running and the test database exists

### Run All postgres-js Tests

```bash
pnpm run test -- test/functional/driver/postgres-js/
```

### Run Specific Test Suite

```bash
# Connection options tests
pnpm run test -- test/functional/driver/postgres-js/connection-options.test.ts

# Entity operations tests
pnpm run test -- test/functional/driver/postgres-js/entity-operations.test.ts

# Advanced features tests
pnpm run test -- test/functional/driver/postgres-js/advanced-features.test.ts
```

### Run Specific Test

```bash
pnpm run test -- test/functional/driver/postgres-js/connection-options.test.ts --grep "should handle various data types"
```

## Test Coverage

The test suite covers:

✅ **Connection Management**

- Pool creation and connection lifecycle
- Authentication and credentials
- Connection options (timeouts, application name, etc.)
- Schema detection

✅ **Query Execution**

- SELECT, INSERT, UPDATE, DELETE operations
- Parameterized queries
- Multiple queries in sequence
- Transaction control (BEGIN, COMMIT, ROLLBACK)
- Savepoints for nested transactions

✅ **Data Types**

- Basic types (INT, TEXT, BOOLEAN, DECIMAL)
- Date/time types
- Arrays
- JSON/JSONB
- NULL handling
- Type conversion

✅ **ORM Features**

- Entity CRUD operations
- Repository operations
- Query builder (filters, ordering, pagination)
- Aggregations and grouping
- Batch operations

✅ **Advanced SQL**

- CTEs (WITH clauses)
- Window functions
- Subqueries
- Set operations (UNION)
- Complex joins

✅ **Edge Cases**

- Empty result sets
- Large parameter sets
- Special characters and escaping
- Zero values
- Very long queries

## Notes

- All tests are isolated and can run in parallel
- Tests automatically clean up and recreate the schema for each suite
- Tests use the same utilities as the existing postgres driver tests
- postgres.js driver is feature-compatible with the pg driver for all TypeORM operations
