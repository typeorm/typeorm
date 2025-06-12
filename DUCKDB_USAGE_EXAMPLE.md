# DuckDB Driver Usage Example

## Installation

First, install the DuckDB Node.js API:

```bash
npm install @duckdb/node-api
```

## Basic Usage

```typescript
import { DataSource } from "typeorm";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Define your entity
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

    @Column({ type: "json" })
    profile: object;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;
}

// Create DataSource
const AppDataSource = new DataSource({
    type: "duckdb",
    database: "./database.duckdb", // or ":memory:" for in-memory
    entities: [User],
    synchronize: true,
    logging: true,
    // DuckDB-specific options
    config: {
        threads: 4,
        max_memory: "2GB",
        enable_progress_bar: true,
    },
    readOnly: false,
    accessMode: "read_write"
});

// Initialize and use
async function main() {
    await AppDataSource.initialize();
    console.log("Connected to DuckDB!");

    const userRepository = AppDataSource.getRepository(User);

    // Create user
    const user = new User();
    user.firstName = "John";
    user.lastName = "Doe";
    user.age = 30;
    user.profile = { interests: ["analytics", "data"] };

    await userRepository.save(user);

    // Query users
    const users = await userRepository.find();
    console.log("Users:", users);

    // Advanced DuckDB features
    const result = await AppDataSource.query(`
        SELECT firstName, COUNT(*) as count 
        FROM user 
        GROUP BY firstName
    `);
    console.log("Aggregated data:", result);

    await AppDataSource.destroy();
}

main().catch(console.error);
```

## Supported Data Types

The DuckDB driver supports these column types:

- **Basic Types**: `boolean`, `integer`, `bigint`, `real`, `double`, `decimal`, `varchar`, `text`, `blob`
- **Date/Time**: `date`, `time`, `timestamp`, `timestamptz`, `interval`  
- **Advanced**: `uuid`, `json`, `array`
- **Spatial**: `geometry`, `geography`, `point`, `linestring`, `polygon`, etc.

## Configuration Options

```typescript
{
    type: "duckdb",
    database: "./path/to/database.duckdb", // File path or ":memory:" 
    
    // DuckDB-specific configuration
    config: {
        max_memory: "2GB",           // Memory limit
        threads: 4,                  // Parallel execution threads
        enable_progress_bar: true,   // Show progress for long queries
        default_null_order: "last",  // NULL ordering in ORDER BY
        enable_object_cache: true,   // Enable object caching
        enable_http_filesystem: false, // Enable HTTP file access
    },
    
    // Access control
    readOnly: false,                 // Read-only mode
    accessMode: "read_write",        // "automatic" | "read_only" | "read_write"
    
    // Standard TypeORM options
    entities: [...],
    synchronize: true,
    logging: true,
}
```

## Advanced Analytics Example

```typescript
// Complex analytical queries using DuckDB's advanced features
const analyticsResult = await AppDataSource.query(`
    WITH user_stats AS (
        SELECT 
            firstName,
            AVG(age) as avg_age,
            COUNT(*) as user_count,
            ARRAY_AGG(lastName) as last_names
        FROM user 
        GROUP BY firstName
    )
    SELECT 
        firstName,
        avg_age,
        user_count,
        last_names[1] as first_lastname  -- Array indexing
    FROM user_stats 
    WHERE user_count > 1
    ORDER BY avg_age DESC
`);
```

## Migration Example

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE user (
                id INTEGER PRIMARY KEY,
                firstName VARCHAR(255) NOT NULL,
                lastName VARCHAR(255) NOT NULL,
                age INTEGER,
                profile JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create index for analytics
        await queryRunner.query(`
            CREATE INDEX idx_user_age ON user(age)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_user_age`);
        await queryRunner.query(`DROP TABLE user`);
    }
}
```

## Performance Tips

1. **Use appropriate data types**: DuckDB excels with columnar analytics
2. **Batch operations**: Use transactions for multiple inserts
3. **Leverage DuckDB's analytical functions**: window functions, aggregations
4. **Configure memory**: Adjust `max_memory` based on your dataset size
5. **Use parallel processing**: Set `threads` to match your CPU cores

## Limitations

- **No streaming support**: `query().stream()` is not available
- **No exclusion constraints**: PostgreSQL-specific feature not supported  
- **No table comments**: DuckDB doesn't support table-level comments
- **Single-process**: DuckDB is embedded, no network connections

## Error Handling

```typescript
try {
    await AppDataSource.initialize();
} catch (error) {
    if (error instanceof DriverPackageNotInstalledError) {
        console.error("Install @duckdb/node-api: npm install @duckdb/node-api");
    } else {
        console.error("Database connection failed:", error);
    }
}
```