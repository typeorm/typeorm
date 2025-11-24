export const resultsTemplates: Record<string, any> = {
    control: `import { MigrationInterface, QueryRunner } from "typeorm";

export class TestMigration1610975184784 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
`,
    javascript: `/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class TestMigration1610975184784 {

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
    }

}
`,
    timestamp: `import { MigrationInterface, QueryRunner } from "typeorm";

export class TestMigration1641163894670 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
`,
}
