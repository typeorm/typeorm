export const createTemplate: string = `import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const tableName = 'test';

export class $ClassName implements MigrationInterface {
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
`
