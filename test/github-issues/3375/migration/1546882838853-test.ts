import { MigrationInterface } from "../../../../src/migration/MigrationInterface";
import { QueryRunner } from "../../../../src/query-runner/QueryRunner";
import { Table } from "../../../../src/schema-builder/table/Table";

export class Test1546882838853 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(new Table({
            name: "test3375",
            columns: [{
                name: "test",
                type: queryRunner.connection.driver.normalizeType({
                    type: "varchar(255)"
                })
            }]
        }));
    }
    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable("test3375", true);
    }
}
