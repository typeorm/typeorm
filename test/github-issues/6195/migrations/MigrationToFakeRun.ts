import { MigrationInterface, QueryRunner, TableColumn } from "../../../../src"

export const testTableName = "test_table"
export const testColumnName = "test_column"
export const nonExistentColumnName = "nonexistent_column"

export class MigrationToFakeRun implements MigrationInterface {
    name = "MigrationToFakeRun" + Date.now()

    async up(queryRunner: QueryRunner) {
        await queryRunner.addColumn(
            testTableName,
            new TableColumn({
                name: testColumnName,
                type: "varchar",
            }),
        )
    }

    async down(queryRunner: QueryRunner) {
        await queryRunner.dropColumn(testTableName, nonExistentColumnName)
    }
}
