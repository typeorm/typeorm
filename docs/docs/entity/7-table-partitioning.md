# Table Partitioning

Table partitioning is a database design technique that allows you to split a large table into smaller, more manageable pieces called partitions. While the table remains a single logical entity to the application, the database stores the data in separate physical files or segments.

TypeORM supports table partitioning for **PostgreSQL (10+)** and **MySQL/MariaDB (5.1+)**.

## Basic Configuration

You can configure partitioning using the `partition` option in the `@Entity` decorator.

```typescript
import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity({
    partition: {
        type: "RANGE",
        columns: ["created_at"],
        partitions: [
            { name: "p2023", values: ["2023-01-01", "2024-01-01"] },
            { name: "p2024", values: ["2024-01-01", "2025-01-01"] }
        ]
    }
})
export class Measurement {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    created_at: Date

    @Column()
    value: number
}
```

> **Important**: In both PostgreSQL and MySQL, the partition key(s) must be part of the table's primary key or any unique index.

## Partition Types & Use Cases

TypeORM supports three main partitioning strategies: `RANGE`, `LIST`, and `HASH`.

### RANGE Partitioning

Table is partitioned into "ranges" defined by a column value or expression.

**Use for**: Time-series data, sequential values, logs, sales records

**Benefits**:
- Easy to drop old data (archiving)
- Efficient range queries
- Simple partition management

**Database-specific syntax**:
- **PostgreSQL**: `FROM` ... `TO` (2 values per partition)
- **MySQL**: `VALUES LESS THAN` (1 value - upper bound)

**Example - Time-based Log Archiving**:

```typescript
// PostgreSQL example - using FROM/TO format
@Entity({
    partition: {
        type: "RANGE",
        columns: ["created_at"],
        partitions: [
            { name: "p2023", values: ["2023-01-01", "2024-01-01"] }, // FROM/TO
            { name: "p2024", values: ["2024-01-01", "2025-01-01"] },
            { name: "p_default", values: ["DEFAULT"] } // Catch-all (PostgreSQL only)
        ]
    }
})
export class LogEntry {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    created_at: Date

    @Column()
    message: string
}

// MySQL example - using VALUES LESS THAN
@Entity({
    partition: {
        type: "RANGE",
        expression: "YEAR(created_at)",
        partitions: [
            { name: "p2023", values: ["2024"] },    // VALUES LESS THAN (2024)
            { name: "p2024", values: ["2025"] },
            { name: "p_max", values: ["MAXVALUE"] } // Upper bound
        ]
    }
})

// Later: Drop old data instantly
await queryRunner.dropPartition("log_entry", "p2023")
```

### LIST Partitioning

Table is partitioned by matching column values against a discrete list of values.

**Use for**: Discrete categorical data, regions, departments, tenant separation

**Benefits**:
- Logical data separation
- Efficient equality queries
- Easier per-category management

**Database-specific syntax**:
- **PostgreSQL**: `VALUES IN (...)` with `DEFAULT` support
- **MySQL**: `VALUES IN (...)` without `DEFAULT` keyword

**Example - Multi-tenant or Regional Data**:

```typescript
@Entity({
    partition: {
        type: "LIST",
        columns: ["region"],
        partitions: [
            { name: "p_north_america", values: ["US", "CA", "MX"] },
            { name: "p_europe", values: ["GB", "FR", "DE", "IT"] },
            { name: "p_asia", values: ["JP", "CN", "IN", "KR"] },
            { name: "p_other", values: ["DEFAULT"] } // PostgreSQL only
        ]
    }
})
export class Customer {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    region: string

    @Column()
    name: string
}
```

### HASH Partitioning

Table is partitioned by applying a hashing function to the partition key. This is useful for distributing data evenly across a fixed number of partitions.

**Use for**: Even distribution of high-volume data, user records, transaction data

**Benefits**:
- Automatic load balancing
- No hotspots (even distribution)
- Scales well with data volume

**Database-specific syntax**:
- **PostgreSQL**: Requires `MODULUS` and `REMAINDER` (2 values)
- **MySQL**: Automatic distribution (empty values array)

**Example - User Activity Distribution**:

```typescript
// PostgreSQL example - uses MODULUS and REMAINDER
@Entity({
    partition: {
        type: "HASH",
        columns: ["user_id"],
        partitions: [
            { name: "p0", values: ["4", "0"] },  // MODULUS 4, REMAINDER 0
            { name: "p1", values: ["4", "1"] },
            { name: "p2", values: ["4", "2"] },
            { name: "p3", values: ["4", "3"] }
        ]
    }
})
export class UserActivity {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    user_id: number

    @Column()
    activity_type: string
}

// MySQL example - automatic distribution
@Entity({
    partition: {
        type: "HASH",
        columns: ["user_id"],
        partitions: [
            { name: "p0", values: [] },
            { name: "p1", values: [] },
            { name: "p2", values: [] },
            { name: "p3", values: [] }
        ]
    }
})
```

## Function-based Partitioning

Instead of using raw columns, you can use an `expression` for partitioning.

```typescript
@Entity({
    partition: {
        type: "RANGE",
        expression: "YEAR(created_at)", // MySQL example
        // expression: "date_trunc('year', created_at)", // PostgreSQL example
        partitions: [
            { name: "p2023", values: ["2023"] },
            { name: "p2024", values: ["2024"] }
        ]
    }
})
```

## Composite Partition Keys

You can partition by multiple columns:

```typescript
@Entity({
    partition: {
        type: "RANGE",
        columns: ["year", "month"],  // Multiple columns
        partitions: [
            { name: "p2023_q1", values: ["2023", "4"] },
            { name: "p2023_q2", values: ["2023", "7"] }
        ]
    }
})
export class Sales {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    year: number

    @PrimaryColumn()
    month: number
}
```

> **Important**: All partition key columns must be part of the table's primary key or unique index.

## Database-specific Differences

| Feature | PostgreSQL | MySQL / MariaDB |
|---------|------------|-----------------|
| **RANGE** | `FROM` ... `TO` (Lower bound inclusive, upper bound exclusive) | `VALUES LESS THAN` (Upper bound exclusive) |
| **LIST** | `VALUES IN (...)` | `VALUES IN (...)` |
| **HASH** | Declarative via `MODULUS` and `REMAINDER` | Automatic distribution |
| **Default Partition** | Supported via `DEFAULT` | Not natively supported for RANGE/LIST (use `MAXVALUE` or catch-all values) |
| **Sub-partitioning** | Manual DDL only (not in entity decorators) | Manual DDL only (not in entity decorators) |
| **Dynamic Management**| Partitions are separate tables | Partitions are internal to the table |

## MySQL COLUMNS vs Expression Syntax

MySQL automatically uses different SQL syntax based on your configuration:

**LIST/RANGE COLUMNS** (when using `columns` array with non-integer types):
```typescript
@Entity({
    partition: {
        type: "LIST",
        columns: ["category"],  // VARCHAR column
        partitions: [...]
    }
})
// Generates: PARTITION BY LIST COLUMNS(category)
```

**LIST/RANGE** (when using `expression` or integer columns):
```typescript
@Entity({
    partition: {
        type: "RANGE",
        expression: "YEAR(sale_date)",
        partitions: [...]
    }
})
// Generates: PARTITION BY RANGE (YEAR(sale_date))
```

## Tablespace Option (PostgreSQL Only)

You can specify a tablespace for partitions in PostgreSQL:

```typescript
@Entity({
    partition: {
        type: "RANGE",
        columns: ["logdate"],
        partitions: [
            {
                name: "p2023",
                values: ["2023-01-01", "2024-01-01"],
                tablespace: "pg_default"  // Optional tablespace
            }
        ]
    }
})
```

## Dynamic Partition Management

TypeORM provides `QueryRunner` methods to manage partitions dynamically, which is useful for creating new partitions on the fly (e.g., for new dates) without changing your entity definitions.

### Creating a Partition

```typescript
const queryRunner = dataSource.createQueryRunner()
// PostgreSQL example - uses FROM/TO format
await queryRunner.createPartition("measurements", {
    name: "p2025_01",
    values: ["2025-01-01", "2025-02-01"] // For MySQL RANGE: ["2025-02-01"]
}, "RANGE")
```

### Dropping a Partition

```typescript
await queryRunner.dropPartition("measurements", "p2023_01")
```

### Listing Partitions

```typescript
const partitions = await queryRunner.getPartitions("measurements")
console.log(partitions) // ["p2024_01", "p2024_02", ...]
```

### Tablespace Option (PostgreSQL Only)

```typescript
await queryRunner.createPartition("measurements", {
    name: "p2025",
    values: ["2025-01-01", "2026-01-01"],
    tablespace: "fast_storage"  // Store on specific tablespace
}, "RANGE")
```

## Schema Synchronization Behavior

### Important Limitations

**Partition configuration is applied only when the table is first created.** TypeORM's schema synchronization does NOT compare or update partition configurations on existing tables.

Once a table is created with partitions, you cannot change:
- Partition type (RANGE → LIST, etc.)
- Partition key columns/expression
- Initial partition definitions

### What Works with `synchronize: true`

```typescript
// WORKS: Creates partitioned table on first sync
@Entity({
    partition: { type: "RANGE", columns: ["logdate"], partitions: [...] }
})

// WORKS: Adding/removing columns, indices, etc.
// (Partition configuration is ignored after table exists)

// DOES NOT WORK: Changing partition config
// Modifying the partition configuration in the entity
// will have NO EFFECT on existing tables
```

### Best Practices

1. **Define partitions in migrations** for production:
```typescript
await queryRunner.query(`
    CREATE TABLE measurements (
        id INT, logdate DATE,
        PRIMARY KEY (id, logdate)
    ) PARTITION BY RANGE (logdate)
`)

await queryRunner.createPartition("measurements", {
    name: "p2023",
    values: ["2023-01-01", "2024-01-01"]
}, "RANGE")
```

2. **Use entity decorators** for development with `dropSchema: true`

3. **Manage partitions dynamically** for time-based partitioning

## Data Insertion Constraints

### What Happens When Data Doesn't Match Any Partition

**PostgreSQL**: Insert fails with error
```
ERROR: no partition of relation "measurements" found for row
```

**MySQL**: Insert fails with error
```
ERROR 1526 (HY000): Table has no partition for value XXX
```

### Solution: Create Catch-All Partitions

**PostgreSQL DEFAULT partition**:
```typescript
partitions: [
    { name: "p2023", values: ["2023-01-01", "2024-01-01"] },
    { name: "p_default", values: ["DEFAULT"] }  // Catches everything else
]
```

**MySQL MAXVALUE**:
```typescript
partitions: [
    { name: "p2023", values: ["2024"] },
    { name: "p_max", values: ["MAXVALUE"] }  // Upper bound
]
```

## Performance Considerations

### Partition Pruning

Databases automatically skip irrelevant partitions when executing queries:

```typescript
// Only scans p2023 partition
SELECT * FROM measurements WHERE logdate BETWEEN '2023-01-01' AND '2023-12-31'

// Scans all partitions (no partition pruning)
SELECT * FROM measurements WHERE value > 100
```

**Tip**: Always include partition key in WHERE clauses for best performance.

## Sub-partitioning

Sub-partitioning is not available via entity decorators. You must use manual DDL (raw SQL queries) to create sub-partitioned structures:

### PostgreSQL Example
```typescript
// Create parent partitioned table via TypeORM
@Entity({
    partition: {
        type: "RANGE",
        columns: ["logdate"],
        partitions: []  // Don't define partitions in entity
    }
})

// Create sub-partitioned structure manually
await queryRunner.query(`
    CREATE TABLE measurements_2023 PARTITION OF measurements
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01')
    PARTITION BY LIST (region)
`)

await queryRunner.query(`
    CREATE TABLE measurements_2023_us PARTITION OF measurements_2023
    FOR VALUES IN ('US', 'CA')
`)
```

### MySQL Example
```typescript
await queryRunner.query(`
    CREATE TABLE measurements (
        id INT, logdate DATE, region VARCHAR(10),
        PRIMARY KEY (id, logdate, region)
    )
    PARTITION BY RANGE (YEAR(logdate))
    SUBPARTITION BY HASH(region)
    SUBPARTITIONS 4 (
        PARTITION p2023 VALUES LESS THAN (2024),
        PARTITION p2024 VALUES LESS THAN (2025)
    )
`)
```

