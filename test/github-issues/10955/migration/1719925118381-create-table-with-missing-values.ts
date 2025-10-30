import { MigrationInterface, QueryRunner } from "../../../../src"

export class CreateTableWithMissingValues1719925118381
    implements MigrationInterface
{
    name = "CreateTableWithMissingValues1719925118381"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."foo_bar_enum" AS ENUM('value1')`,
        )
        await queryRunner.query(
            `CREATE TABLE "foo" ("id" SERIAL NOT NULL, "bar" "public"."foo_bar_enum" NOT NULL, CONSTRAINT "PK_3955faa3e62aba1963fccbe0708" PRIMARY KEY ("id"))`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "foo"`)
        await queryRunner.query(`DROP TYPE "public"."foo_bar_enum"`)
    }
}
