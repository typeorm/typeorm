import { MigrationInterface } from "../../../../src/migration/MigrationInterface";
import { QueryRunner } from "../../../../src/query-runner/QueryRunner";

export class CreateUuidExtension1544044606093 implements MigrationInterface {
    public up(queryRunner: QueryRunner): Promise<any> {
        return queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    }

    public down(queryRunner: QueryRunner): Promise<any> {
        return queryRunner.query("DROP EXTENSION \"uuid-ossp\"");
    }
}
