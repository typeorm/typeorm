import { MigrationInterface } from "typeorm/migration/MigrationInterface"
import { QueryRunner } from "typeorm/query-runner/QueryRunner"

export class ExampleMigrationTwo1530542855524 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {}
    public async down(queryRunner: QueryRunner): Promise<void> {}
}
