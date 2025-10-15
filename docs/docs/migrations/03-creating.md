# Creating manually

You can create a new migration using CLI by specifying the name and location of the migration:

```shell
npx typeorm migration:create <path/to/migrations>/<migration-name>
```

For example:

```shell
npx typeorm migration:create src/db/migrations/post-refactoring
```

After you run the command you can see a new file generated in the `src/db/migrations` directory named `{TIMESTAMP}-post-refactoring.ts` where `{TIMESTAMP}` is the current timestamp when the migration was generated.

Now you can open the file and add your migration sql queries there. You should see the following content inside your migration:

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
`down` method is used to revert the last migration.

Inside both `up` and `down` you have a `QueryRunner` object.
All database operations are executed using this object.
Learn more about [query runner](../query-runner.md).

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
        ) // reverts things made in "up" method
    }
}
```
