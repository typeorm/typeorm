import { MigrationInterface, QueryRunner } from "../../../../src"

export class init1676011161422 implements MigrationInterface {
    name = "init1676011161422"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "example_entity"
             (
                 "id"         int NOT NULL IDENTITY(1,1),
                 "enumcolumn" nvarchar(255) CONSTRAINT CHK_a80c9d6a2a8749d7aadb857dc6_ENUM CHECK (enumcolumn IN ('enumvalue1','enumvalue2','enumvalue3')) NOT NULL,
                 CONSTRAINT "PK_fccd73330168066a434dbac114f" PRIMARY KEY ("id")
             )`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "example_entity"`)
    }
}
