export const sqlite: Record<string, string> = {
    control: `import { MigrationInterface, QueryRunner } from "@hckrnews/typeorm";

export class TestMigration1610975184784 implements MigrationInterface {
    name = 'TestMigration1610975184784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))\`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`DROP TABLE "post"\`);
    }

}`,
    javascript: `/**
 * @typedef {import('@hckrnews/typeorm').QueryRunner} QueryRunner
 * @typedef {import('@hckrnews/typeorm').MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class TestMigration1610975184784 {
    name = 'TestMigration1610975184784'

    /**
     * @param {QueryRunner} queryRunner
     * @returns {Promise<void>}
     */
    async up(queryRunner) {
        await queryRunner.query(\`CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))\`);
    }

    /**
     * @param {QueryRunner} queryRunner
     * @returns {Promise<void>}
     */
    async down(queryRunner) {
        await queryRunner.query(\`DROP TABLE "post"\`);
    }
}`,
    timestamp: `import { MigrationInterface, QueryRunner } from "@hckrnews/typeorm";

export class TestMigration1641163894670 implements MigrationInterface {
    name = 'TestMigration1641163894670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))\`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`DROP TABLE "post"\`);
    }

}`,
}
