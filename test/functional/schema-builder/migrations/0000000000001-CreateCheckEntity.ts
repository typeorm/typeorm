import { MigrationInterface } from "../../../../src/migration/MigrationInterface"
import { QueryRunner } from "../../../../src/query-runner/QueryRunner"

export class CreateCheckEntity0000000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE "check_entity" (
                "id" SERIAL PRIMARY KEY,
                "value" integer NOT NULL,
                "enumValue" text NOT NULL,
                CONSTRAINT "CHK_composite" CHECK ("value" < 0 AND "enumValue" IN ('A', 'B')),
                CONSTRAINT "CHK_value_positive" CHECK ("value" > 0),
                CONSTRAINT "CHK_enum_value" CHECK ("enumValue" IN ('A', 'B', 'C', 'D'))
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "check_entity"`)
    }
}
