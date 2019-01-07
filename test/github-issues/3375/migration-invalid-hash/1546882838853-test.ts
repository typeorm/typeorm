import { MigrationInterface } from "../../../../src/migration/MigrationInterface";
import { QueryRunner } from "../../../../src/query-runner/QueryRunner";

export class Test1546882838853 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        // the following line is to make the hash different
        1 + 1;
    }
    public async down(queryRunner: QueryRunner): Promise<any> {
    }
}
