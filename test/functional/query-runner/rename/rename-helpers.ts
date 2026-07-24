import type { DataSource, QueryRunner } from "../../../../src"
import { Table, TableColumn } from "../../../../src"

/**
 * Creates a three-column table (`id`, `a`, `b`) used by the simpler rename
 * primitive tests (index, unique, check, exclusion). Tests that need a
 * different shape (PK with `primaryKeyConstraintName`, FK with two tables)
 * build their tables inline.
 */
export async function makeTable(
    dataSource: DataSource,
    tableName: string,
): Promise<QueryRunner> {
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.createTable(
        new Table({
            name: tableName,
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "a",
                    type: "int",
                    isNullable: true,
                }),
                new TableColumn({
                    name: "b",
                    type: "int",
                    isNullable: true,
                }),
            ],
        }),
        true,
    )
    return queryRunner
}
