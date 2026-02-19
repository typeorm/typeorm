import { MigrationInterface, QueryRunner } from "../../../../src"

export class Init1721739455264 implements MigrationInterface {
    name = "Init1721739455264"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "entity_with_virtual_column" ("id" SERIAL NOT NULL, "foo" integer NOT NULL, CONSTRAINT "PK_a672668c50ee532de44f2d392a4" PRIMARY KEY ("id"))`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "entity_with_virtual_column"`)
    }
}
