import type { MigrationInterface, QueryRunner } from "../../../../../src"
import { Table } from "../../../../../src"

export class CreatePost1730000000001 implements MigrationInterface {
    migrationMetadata?: Record<string, string | number | boolean | null>

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "issue3375_post",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "36",
                        isPrimary: true,
                    },
                ],
            }),
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("issue3375_post")
    }
}
