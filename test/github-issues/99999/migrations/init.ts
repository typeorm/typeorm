import type { MigrationInterface, QueryRunner } from "../../../../src"

export class CreateDatabase implements MigrationInterface {
    name = "CreateDatabase1779543766080"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "author" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL)`,
        )

        // Each CONSTRAINT clause below intentionally spans multiple lines.
        // The SQLite driver parses these names back out of sqlite_master.sql
        // with regexes; before the fix those regexes required a literal
        // single space between keywords (e.g. `) REFERENCES`, `UNIQUE (`,
        // `CHECK (`), so newlines inside the clauses caused name extraction
        // to fail.
        await queryRunner.query(
            `CREATE TABLE "post" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "authorId" integer NOT NULL,
                "slug" varchar NOT NULL,
                CONSTRAINT "FK_post_authorId" FOREIGN KEY ("authorId")
                    REFERENCES "author" ("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_post_slug" UNIQUE
                    ("slug"),
                CONSTRAINT "CHK_post_slug" CHECK
                    (slug <> '')
            )`,
        )
    }

    async down(_queryRunner: QueryRunner): Promise<void> {}
}
