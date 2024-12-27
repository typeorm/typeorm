export const resultsTemplates: Record<string, any> = {
    control: `import { MigrationInterface, QueryRunner } from "typeorm";

export class TestMigration1610975184784 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
`,
    javascript: `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class TestMigration1610975184784 {

    async up(queryRunner) {
    }

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
    template: `import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const tableName = 'test';

export class TestMigration1610975184784 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    return queryRunner.addColumn(
      tableName,
      new TableColumn({
        name: 'count',
        type: 'int',
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return queryRunner.dropColumn(tableName, 'count');
  }
}
`,
}
