# Generating

TypeORM is able to automatically generate migration files based on the changes you made to the entities, comparing them with existing database schema on the server.

Automatic migration generation creates a new migration file and writes all sql queries that must be executed to update the database. If no changes are detected, the command will exit with code `1`.

Let's say you have a `Post` entity with a `title` column, and you have changed the name `title` to `name`.

You can generate migration with of the following command:

```shell
typeorm migration:generate -d <path/to/datasource> <migration-name>
```

The `-d` argument value should specify the path where your [DataSource](../data-source/1-data-source.md) instance is defined.

Alternatively you can also specify name with `--name` param

```shell
typeorm migration:generate -- -d <path/to/datasource> --name=<migration-name>
```

or use a full path:

```shell
typeorm migration:generate -d <path/to/datasource> <path/to/migrations>/<migration-name>
```

Assuming you used `post-refactoring` as a name, it will generate a new file called `{TIMESTAMP}-post-refactoring.ts` with the following content:

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

Alternatively, you can also output your migrations as Javascript files using the `o` (alias for `--outputJs`) flag. This is useful for Javascript only projects in which TypeScript additional packages are not installed. This command, will generate a new migration file `{TIMESTAMP}-PostRefactoring.js` with the following content:

```javascript
/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class PostRefactoringTIMESTAMP {
    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(
            `ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name"`,
        )
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(
            `ALTER TABLE "post" ALTER COLUMN "name" RENAME TO "title"`,
        )
    }
}
```

By default, it generates CommonJS JavaScript code with the `o` (alias for `--outputJs`) flag, but you can also generate ESM code with the `esm` flag. This is useful for Javascript projects that use ESM:

```javascript
/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
export class PostRefactoringTIMESTAMP {
    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(
            `ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name"`,
        )
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(
            `ALTER TABLE "post" ALTER COLUMN "name" RENAME TO "title"`,
        )
    }
}
```

See, you don't need to write the queries on your own.

The rule of thumb for generating migrations is that you generate them after **each** change you made to your models. To apply multi-line formatting to your generated migration queries, use the `p` (alias for `--pretty`) flag.
