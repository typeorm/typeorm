import { MigrationInterface, QueryRunner } from "../../../../src"

export class CreateTableWithSpecialCharsMissingValues1719925118383
    implements MigrationInterface
{
    name = "CreateTableWithSpecialCharsMissingValues1719925118383"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."foo_with_special_chars_bar_enum" AS ENUM('simple', 'user''s choice')`,
        )
        await queryRunner.query(
            `CREATE TABLE "foo_with_special_chars" ("id" SERIAL NOT NULL, "bar" "public"."foo_with_special_chars_bar_enum" NOT NULL, CONSTRAINT "PK_foo_with_special_chars" PRIMARY KEY ("id"))`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "foo_with_special_chars"`)
        await queryRunner.query(
            `DROP TYPE "public"."foo_with_special_chars_bar_enum"`,
        )
    }
}
