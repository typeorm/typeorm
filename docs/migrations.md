---

# Migrations

- [Migrations](#migrations)
  - [How migrations work](#how-migrations-work)
  - [Creating a new migration](#creating-a-new-migration)
  - [Running and reverting migrations](#running-and-reverting-migrations)
    - [Faking Migrations and Rollbacks](#faking-migrations-and-rollbacks)
    - [Transaction modes](#transaction-modes)
  - [Generating migrations](#generating-migrations)
  - [DataSource option](#datasource-option)
  - [Timestamp option](#timestamp-option)
  - [Using migration API to write migrations](#using-migration-api-to-write-migrations)
  - [Using SaferMigrations for Data Integrity](#using-safermigrations-for-data-integrity)

## How migrations work

Once you get into production you'll need to synchronize model changes into the database.
Typically, it is unsafe to use `synchronize: true` for schema synchronization on production once
you get data in your database. Here is where migrations come to help.

A migration is just a single file with SQL queries to update a database schema
and apply new changes to an existing database.

Let's say you already have a database and a post entity:

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string
}
```

And your entity worked in production for months without any changes.
You have thousands of posts in your database.

Now you need to make a new release and rename `title` to `name`.
What would you do?

You need to create a new migration with the following SQL query (PostgreSQL dialect):

```sql
ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name";
```

Once you run this SQL query, your database schema is ready to work with your new codebase.
TypeORM provides a place where you can write such SQL queries and run them when needed.
This place is called "migrations".

## Creating a new migration

**Pre-requisites**: [Installing CLI](./using-cli.md#installing-cli)

Before creating a new migration, you need to set up your data source options properly:

```ts
{
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [/*...*/],
    migrations: [/*...*/],
    migrationsTableName: "custom_migration_table",
}
```

Here we set up two options:

- `"migrationsTableName": "migrations"` - Specify this option only if you need the migration table name to be different from `"migrations"`.
- `"migrations": [/*...*/]` - List of migrations that need to be loaded by TypeORM.

Once you set up the connection options, you can create a new migration using CLI:

```
typeorm migration:create ./path-to-migrations-dir/PostRefactoring
```

Here, `PostRefactoring` is the name of the migration - you can specify any name you want.
After you run the command, you can see a new file generated in the "migration" directory
named `{TIMESTAMP}-PostRefactoring.ts` where `{TIMESTAMP}` is the current timestamp when the migration was generated.
Now you can open the file and add your migration SQL queries there.

You should see the following content inside your migration:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm"

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {}

    async down(queryRunner: QueryRunner): Promise<void> {}
}
```

There are two methods you must fill with your migration code: `up` and `down`.
`up` has to contain the code you need to perform the migration.
`down` has to revert whatever `up` changed.
The `down` method is used to revert the last migration.

Inside both `up` and `down`, you have a `QueryRunner` object.
All database operations are executed using this object.
Learn more about [query runner](./query-runner.md).

Let's see what the migration looks like with our `Post` changes:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm"

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "post" RENAME COLUMN "title" TO "name"`,
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "post" RENAME COLUMN "name" TO "title"`,
        ) // Reverts things made in "up" method
    }
}
```

## Running and reverting migrations

Once you have a migration to run on production, you can run it using a CLI command:

```
typeorm migration:run -- -d path-to-datasource-config
```

**`typeorm migration:create` and `typeorm migration:generate` will create `.ts` files, unless you use the `o` flag (see more in [Generating migrations](#generating-migrations)). The `migration:run` and `migration:revert` commands only work on `.js` files. Thus the TypeScript files need to be compiled before running the commands.** Alternatively, you can use `ts-node` in conjunction with `typeorm` to run `.ts` migration files.

Example with `ts-node`:

```
npx typeorm-ts-node-commonjs migration:run -- -d path-to-datasource-config
```

Example with `ts-node` in ESM projects:

```
npx typeorm-ts-node-esm migration:run -- -d path-to-datasource-config
```

```
npx typeorm-ts-node-esm migration:generate ./src/migrations/update-post-table -d ./src/data-source.ts
```

This command will execute all pending migrations and run them in a sequence ordered by their timestamps.
This means all SQL queries written in the `up` methods of your created migrations will be executed.
That's all! Now you have your database schema up-to-date.

If for some reason you want to revert the changes, you can run:

```
typeorm migration:revert -- -d path-to-datasource-config
```

This command will execute `down` in the latest executed migration.
If you need to revert multiple migrations, you must call this command multiple times.

### Faking Migrations and Rollbacks

You can also fake run a migration using the `--fake` flag (`-f` for short). This will add the migration
to the migrations table without running it. This is useful for migrations created after manual changes
have already been made to the database or when migrations have been run externally
(e.g. by another tool or application), and you still would like to keep a consistent migration history.

```
typeorm migration:run --fake
```

This is also possible with rollbacks.

```
typeorm migration:revert --fake
```

### Transaction modes

By default, TypeORM will run all your migrations within a single wrapping transaction.
This corresponds to the `--transaction all` flag.
If you require more fine-grained transaction control, you can use the `--transaction each` flag to wrap every migration individually, or the `--transaction none` flag to opt out of wrapping the migrations in transactions altogether.

In addition to these flags, you can also override the transaction behavior on a per-migration basis by setting the `transaction` property on the `MigrationInterface` to `true` or `false`. This only works in the `each` or `none` transaction mode.

```typescript
import { MigrationInterface, QueryRunner } from "typeorm"

export class AddIndexTIMESTAMP implements MigrationInterface {
    transaction = false

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX CONCURRENTLY post_names_idx ON post(name)`
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX CONCURRENTLY post_names_idx`,
        )
    }
}
```

## Generating migrations

TypeORM is able to automatically generate migration files with schema changes you made.

Let's say you have a `Post` entity with a `title` column, and you have changed the name `title` to `name`.
You can run the following command:

```
typeorm migration:generate PostRefactoring -d path-to-datasource-config
```

If you encounter any error, it may require you to have the path to migration name and data source. You can try this option:

```
typeorm migration:generate -d <path/to/datasource> path/to/migrations/<migration-name>
```

And it will generate a new migration called `{TIMESTAMP}-PostRefactoring.ts` with the following content:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm"

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name"`,
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "post" ALTER COLUMN "name" RENAME TO "title"`,
        )
    }
}
```

Alternatively, you can also output your migrations as JavaScript files using the `o` (alias

 for `--outputJs`) flag. This is useful for JavaScript-only projects in which TypeScript additional packages are not installed. This command will generate a new migration file `{TIMESTAMP}-PostRefactoring.js` with the following content:

```javascript
const { MigrationInterface, QueryRunner } = require("typeorm")

module.exports = class PostRefactoringTIMESTAMP {
    async up(queryRunner) {
        await queryRunner.query(
            `ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name"`,
        )
    }

    async down(queryRunner) {
        await queryRunner.query(
            `ALTER TABLE "post" ALTER COLUMN "name" RENAME TO "title"`,
        )
    }
}
```

See, you don't need to write the queries on your own.
The rule of thumb for generating migrations is that you generate them after **each** change you made to your models. To apply multi-line formatting to your generated migration queries, use the `p` (alias for `--pretty`) flag.

## DataSource option

If you need to run/revert/generate/show your migrations, use the `-d` (alias for `--dataSource`) and pass the path to the file where your DataSource instance is defined as an argument:

```
typeorm -d <your-data-source-path> migration:{run|revert}
```

## Timestamp option

If you need to specify a timestamp for the migration name, use the `-t` (alias for `--timestamp`) and pass the timestamp (should be a non-negative number):

```
typeorm -t <specific-timestamp> migration:{create|generate}
```

You can get a timestamp from:

```js
Date.now()
/* OR */ new Date().getTime()
```

## Using migration API to write migrations

In order to use an API to change a database schema, you can use `QueryRunner`.

Example:

```typescript
import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
    TableColumn,
    TableForeignKey,
} from "typeorm"

export class QuestionRefactoringTIMESTAMP implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "question",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "varchar",
                    },
                ],
            }),
            true,
        )

        await queryRunner.createIndex(
            "question",
            new TableIndex({
                name: "IDX_QUESTION_NAME",
                columnNames: ["name"],
            }),
        )

        await queryRunner.createTable(
            new Table({
                name: "answer",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "varchar",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true,
        )

        await queryRunner.addColumn(
            "answer",
            new TableColumn({
                name: "questionId",
                type: "int",
            }),
        )

        await queryRunner.createForeignKey(
            "answer",
            new TableForeignKey({
                columnNames: ["questionId"],
                referencedColumnNames: ["id"],
                referencedTableName: "question",
                onDelete: "CASCADE",
            }),
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("answer")
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("questionId") !== -1,
        )
        await queryRunner.dropForeignKey("answer", foreignKey)
        await queryRunner.dropColumn("answer", "questionId")
        await queryRunner.dropTable("answer")
        await queryRunner.dropIndex("question", "IDX_QUESTION_NAME")
        await queryRunner.dropTable("question")
    }
}
```

## Using SaferMigrations for Data Integrity

To prevent data loss during column type changes in your migrations, you can use the `SaferMigrations` utility. This utility backs up specified columns' data into a temporary table and restores it after the migration.

### How to Use SaferMigrations

1. **Install Dependencies:**
   Ensure you have the necessary dependencies installed, including TypeORM and TypeScript.

2. **Configure Your Migration:**
   Edit your migration file and add the configuration for the `up` and `down` functions.

   ```typescript
   import { MigrationInterface, QueryRunner } from 'typeorm';
   import { SaferMigrations, TableBackupConfig } from './path-to/safer-migration';

   export class ExampleMigration implements MigrationInterface {
     tableConfigs: TableBackupConfig[] = [
       { tableName: 'products', primaryKeyColumns: ['id'], backupColumns: ['description'] },
       { tableName: 'orders', primaryKeyColumns: ['order_id', 'product_id'], backupColumns: ['quantity'] }
     ];

     public async up(queryRunner: QueryRunner): Promise<void> {
       await SaferMigrations.start(queryRunner, this.tableConfigs);

       // Your migration code here...
       // Example: await queryRunner.query(`ALTER TABLE products MODIFY COLUMN description TEXT`);

       await SaferMigrations.done(queryRunner, this.tableConfigs);
     }

     public async down(queryRunner: QueryRunner): Promise<void> {
       await SaferMigrations.start(queryRunner, this.tableConfigs);

       // Your migration code here...
       // Example: await queryRunner.query(`ALTER TABLE products MODIFY COLUMN description VARCHAR(255)`);

       await SaferMigrations.done(queryRunner, this.tableConfigs);
     }
   }
   ```

3. **Run the Migration:**
   Execute the migration script using TypeORM's migration command:

   ```bash
   yarn typeorm migration:run
   ```
   or
   ```bash
   npm run typeorm migration:run
   ```

This ensures your data is safely backed up and restored during migrations, maintaining data integrity throughout the process.

---
