# Table Partitioning

Table partitioning is a database design technique that allows you to split a large table into smaller, more manageable pieces called partitions. While the table remains a single logical entity to the application, the database stores the data in separate physical files or segments.

TypeORM supports table partitioning for **PostgresSQL (10+)** and **MySQL/MariaDB (5.1+)**.

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

> **Note**: In both PostgreSQL and MySQL, the partition key(s) must be part of the table's primary key or any unique index.

## Partition Types

TypeORM supports three main partitioning strategies: `RANGE`, `LIST`, and `HASH`.

### RANGE Partitioning

Table is partitioned into "ranges" defined by a column value or expression.

#### PostgreSQL Example
In PostgreSQL, range partitions are defined with `FROM` and `TO` values.

```typescript
@Entity({
    partition: {
        type: "RANGE",
        columns: ["age"],
        partitions: [
            { name: "age_young", values: ["0", "30"] },
            { name: "age_middle", values: ["30", "60"] },
            { name: "age_old", values: ["60", "120"] },
            { name: "age_default", values: ["DEFAULT"] } // Catch-all partition
        ]
    }
})
```

#### MySQL Example
In MySQL, range partitions use `VALUES LESS THAN`.

```typescript
@Entity({
    partition: {
        type: "RANGE",
        columns: ["year"],
        partitions: [
            { name: "p0", values: ["2010"] },
            { name: "p1", values: ["2020"] },
            { name: "p2", values: ["MAXVALUE"] }
        ]
    }
})
```

### LIST Partitioning

Table is partitioned by matching column values against a discrete list of values.

```typescript
@Entity({
    partition: {
        type: "LIST",
        columns: ["country_code"],
        partitions: [
            { name: "p_north_america", values: ["US", "CA", "MX"] },
            { name: "p_europe", values: ["GB", "FR", "DE", "IT"] },
            { name: "p_other", values: ["DEFAULT"] } // PostgreSQL only
        ]
    }
})
```

### HASH Partitioning

Table is partitioned by applying a hashing function to the partition key. This is useful for distributing data evenly across a fixed number of partitions.

#### PostgreSQL Example
Requires `MODULUS` and `REMAINDER`.

```typescript
@Entity({
    partition: {
        type: "HASH",
        columns: ["id"],
        partitions: [
            { name: "p0", values: ["4", "0"] }, // MODULUS 4, REMAINDER 0
            { name: "p1", values: ["4", "1"] }, // MODULUS 4, REMAINDER 1
            { name: "p2", values: ["4", "2"] }, // MODULUS 4, REMAINDER 2
            { name: "p3", values: ["4", "3"] }  // MODULUS 4, REMAINDER 3
        ]
    }
})
```

#### MySQL Example
MySQL automatically handles the distribution based on the number of partitions.

```typescript
@Entity({
    partition: {
        type: "HASH",
        columns: ["id"],
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

## Database-specific Differences

| Feature | PostgreSQL | MySQL / MariaDB |
|---------|------------|-----------------|
| **RANGE** | `FROM` ... `TO` (Lower bound inclusive, upper bound exclusive) | `VALUES LESS THAN` (Upper bound exclusive) |
| **LIST** | `VALUES IN (...)` | `VALUES IN (...)` |
| **HASH** | Declarative via `MODULUS` and `REMAINDER` | Automatic distribution |
| **Default Partition** | Supported via `DEFAULT` | Not natively supported for RANGE/LIST (use `MAXVALUE` or catch-all values) |
| **Sub-partitioning** | Supported (via manual DDL or nested entities) | Supported |
| **Dynamic Management**| Partitions are separate tables | Partitions are internal to the table |

## Dynamic Partition Management

TypeORM provides `QueryRunner` methods to manage partitions dynamically, which is useful for creating new partitions on the fly (e.g., for new dates) without changing your entity definitions.

### Creating a Partition

```typescript
const queryRunner = dataSource.createQueryRunner()
await queryRunner.createPartition("measurements", {
    name: "p2025_01",
    values: ["2025-01-01", "2025-02-01"]
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

## Common Use Cases

### Time-based Partitioning (Archiving)
Partitioning by `created_at` or `log_date` allows you to easily drop old data by simply dropping a partition, which is much faster than `DELETE FROM table WHERE ...`.

### Multi-tenant Data Separation
Partitioning by `tenant_id` using `LIST` partitioning can improve query performance when filtering by tenant and allows for easier data management per tenant.

### Large Scale Distribution
Using `HASH` partitioning to distribute high-volume data (like clickstream or sensor data) across multiple physical segments to avoid I/O bottlenecks.
