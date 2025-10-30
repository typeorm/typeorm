import { MigrationInterface, QueryRunner } from "../../../../src"

export class CreateTableWithDifferentName1719925118382
    implements MigrationInterface
{
    name = "CreateTableWithDifferentName1719925118382"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."goo_bar_enum" AS ENUM('value1', 'value2', 'value3', 'value4')`,
        )
        await queryRunner.query(
            `CREATE TABLE "foo" ("id" SERIAL NOT NULL, "bar" "public"."goo_bar_enum" NOT NULL, CONSTRAINT "PK_3955faa3e62aba1963fccbe0708" PRIMARY KEY ("id"))`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "foo"`)
        await queryRunner.query(`DROP TYPE "public"."goo_bar_enum"`)
    }
}
