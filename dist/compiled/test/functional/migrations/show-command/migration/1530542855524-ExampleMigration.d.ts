import { MigrationInterface } from "../../../../../src/migration/MigrationInterface";
import { QueryRunner } from "../../../../../src/query-runner/QueryRunner";
export declare class ExampleMigration1530542855524 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<any>;
    down(queryRunner: QueryRunner): Promise<any>;
}
