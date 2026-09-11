import type { MigrationInterface } from "../../../../src/migration/MigrationInterface"
import type { QueryRunner } from "../../../../src/query-runner/QueryRunner"

export class CreateIndexConcurrently0000000000002 implements MigrationInterface {
    public transaction = false

    public async up(queryRunner: QueryRunner) {
        await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "IDX_USER_NAME" ON "users" ("name")`,
        )
    }

    public async down(queryRunner: QueryRunner) {
        await queryRunner.query(
            `CREATE UNIQUE INDEX CONCURRENTLY "IDX_USER_ID" ON "users" ("id")`,
        )
    }
}
