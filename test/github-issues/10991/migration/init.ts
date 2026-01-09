import { MigrationInterface, QueryRunner } from "../../../../src"

export const TEST_TABLE_NAME = `This is the "Table Name"`

export class CreateDatabase0000000000001 implements MigrationInterface {
    name = "CreateDatabase0000000000001"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "${TEST_TABLE_NAME.replace(/"/g, '""')}" ()`,
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {}
}
