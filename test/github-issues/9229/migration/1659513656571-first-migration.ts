import { MigrationInterface, QueryRunner } from "../../../../src"
export class firstMigration1659513656571 implements MigrationInterface {
    name = "first-migration1659513656571"
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "user" ("id" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
        )
        await queryRunner.query(
            `CREATE TABLE "testEntity" ("userId" character varying NOT NULL, "x" jsonb NOT NULL, CONSTRAINT "PK_3138077fc5fcc8a4e4e3c175f40" PRIMARY KEY ("userId"))`,
        )
        await queryRunner.query(
            `ALTER TABLE "testEntity" ADD CONSTRAINT "FK_3138077fc5fcc8a4e4e3c175f40" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "testEntity" DROP CONSTRAINT "FK_3138077fc5fcc8a4e4e3c175f40"`,
        )
        await queryRunner.query(`DROP TABLE "testEntity"`)
        await queryRunner.query(`DROP TABLE "user"`)
    }
}
