import { MigrationInterface, QueryRunner } from "typeorm";

export class TestAlter1748096199383 implements MigrationInterface {
  name = 'TestAlter1748096199383'

  public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "age" integer NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "name", "age") SELECT "id", "name", "age" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "age" bigint NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "name", "age") SELECT "id", "name", "age" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "age" integer NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "user"("id", "name", "age") SELECT "id", "name", "age" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "age" integer NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "user"("id", "name", "age") SELECT "id", "name", "age" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
  }
}
