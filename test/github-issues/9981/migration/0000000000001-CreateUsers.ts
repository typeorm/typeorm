import type { MigrationInterface } from "../../../../src/migration/MigrationInterface"
import type { QueryRunner } from "../../../../src/query-runner/QueryRunner"
import { Table } from "../../../../src/schema-builder/table/Table"

export class CreateUsers0000000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner) {
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "name",
                        type: "varchar",
                    },
                ],
            }),
        )
    }

    public async down(queryRunner: QueryRunner) {
        await queryRunner.dropTable("users")
    }
}
