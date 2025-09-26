# Faking Migrations and Rollbacks

You can also fake run a migration using the `--fake` flag (`-f` for short). This will add the migration
to the migrations table without running it. This is useful for migrations created after manual changes
have already been made to the database or when migrations have been run externally
(e.g. by another tool or application), and you still would like to keep a consistent migration history.

```shell
typeorm migration:run -d path-to-datasource-config --fake
```

This is also possible with rollbacks.

```shell
typeorm migration:revert -d path-to-datasource-config --fake
```

### Transaction modes

By default, TypeORM will run all your migrations within a single wrapping transaction.
This corresponds to the `--transaction all` flag.
If you require more fine grained transaction control, you can use the `--transaction each` flag to wrap every migration individually, or the `--transaction none` flag to opt out of wrapping the migrations in transactions altogether.

In addition to these flags, you can also override the transaction behavior on a per-migration basis by setting the `transaction` property on the `MigrationInterface` to `true` or `false`. This only works in the `each` or `none` transaction mode.

```typescript
import { MigrationInterface, QueryRunner } from "typeorm"

export class AddIndexTIMESTAMP implements MigrationInterface {
    transaction = false

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX CONCURRENTLY post_names_idx ON post(name)`,
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX CONCURRENTLY post_names_idx`)
    }
}
```
