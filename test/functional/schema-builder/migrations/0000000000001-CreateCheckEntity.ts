import { Table } from "../../../../src"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import type { MigrationInterface } from "../../../../src/migration/MigrationInterface"
import type { QueryRunner } from "../../../../src/query-runner/QueryRunner"
import { MyEnum } from "../entity/check-migration/CheckEntity"

export class CreateCheckEntity0000000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        let enumColumnType: string
        switch (queryRunner.dataSource.driver.options.type) {
            case "oracle":
                enumColumnType = "varchar2"
                break
            case "mssql":
            case "sap":
                enumColumnType = "nvarchar"
                break
            case "better-sqlite3":
            case "sqljs":
                enumColumnType = "integer"
                break
            default:
                enumColumnType = "text"
        }

        await queryRunner.createTable(
            new Table({
                name: "check_entity",
                columns: [
                    {
                        name: "id",
                        type: DriverUtils.isSQLiteFamily(
                            queryRunner.dataSource.driver,
                        )
                            ? "integer"
                            : "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "value",
                        type: DriverUtils.isSQLiteFamily(
                            queryRunner.dataSource.driver,
                        )
                            ? "integer"
                            : "int",
                    },
                    {
                        name: "enumValue",
                        type: enumColumnType,
                        enum: Object.values(MyEnum),
                    },
                ],
                checks: [
                    {
                        expression: `"value" < 0 AND "enumValue" IN ('A', 'B')`,
                    },
                    {
                        expression: `"value" > 0`,
                    },
                    {
                        name: "CHK_enum_value",
                        expression: `"enumValue" IN ('A', 'B', 'C', 'D')`,
                    },
                ],
            }),
        )
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable("check_entity", true)
    }
}
