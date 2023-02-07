export const resultsTemplates: Record<string, any> = {
    control: `import {MigrationInterface, QueryRunner} from "typeorm";

export class testMigration1610975184784 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}`,
    javascript: `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class testMigration1610975184784 {

    async up(queryRunner) {
    }

    async down(queryRunner) {
    }
}`,
    timestamp: `import {MigrationInterface, QueryRunner} from "typeorm";

export class testMigration1641163894670 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}`,
}
