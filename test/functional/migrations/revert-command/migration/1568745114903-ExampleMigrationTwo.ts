import { MigrationInterface } from "../../../../../src/migration/MigrationInterface"
import { QueryRunner } from "../../../../../src/query-runner/QueryRunner"

export class ExampleMigrationTwo1568745114903 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {}
    public async down(queryRunner: QueryRunner): Promise<any> {}
}
