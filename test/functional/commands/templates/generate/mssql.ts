export const mssql: Record<string, string> = {
    control: `import { MigrationInterface, QueryRunner } from "typeorm";

export class TestMigration1610975184784 implements MigrationInterface {
    name = 'TestMigration1610975184784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`CREATE TABLE "post" ("id" int NOT NULL IDENTITY(1,1), "title" nvarchar(255) NOT NULL, "createdAt" datetime2 NOT NULL CONSTRAINT "DF_fb91bea2d37140a877b775e6b2a" DEFAULT getdate(), CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))\`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`IF OBJECTPROPERTY(OBJECT_ID('"post"'), 'TableTemporalType') = 2 ALTER TABLE "post" SET (SYSTEM_VERSIONING = OFF); DROP TABLE "post"\`);
    }

}`,
    javascript: `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class TestMigration1610975184784 {
    name = 'TestMigration1610975184784'

    async up(queryRunner) {
        await queryRunner.query(\`CREATE TABLE "post" ("id" int NOT NULL IDENTITY(1,1), "title" nvarchar(255) NOT NULL, "createdAt" datetime2 NOT NULL CONSTRAINT "DF_fb91bea2d37140a877b775e6b2a" DEFAULT getdate(), CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))\`);
    }

    async down(queryRunner) {
        await queryRunner.query(\`IF OBJECTPROPERTY(OBJECT_ID('"post"'), 'TableTemporalType') = 2 ALTER TABLE "post" SET (SYSTEM_VERSIONING = OFF); DROP TABLE "post"\`);
    }
}`,
    timestamp: `import { MigrationInterface, QueryRunner } from "typeorm";

export class TestMigration1641163894670 implements MigrationInterface {
    name = 'TestMigration1641163894670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`CREATE TABLE "post" ("id" int NOT NULL IDENTITY(1,1), "title" nvarchar(255) NOT NULL, "createdAt" datetime2 NOT NULL CONSTRAINT "DF_fb91bea2d37140a877b775e6b2a" DEFAULT getdate(), CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))\`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`IF OBJECTPROPERTY(OBJECT_ID('"post"'), 'TableTemporalType') = 2 ALTER TABLE "post" SET (SYSTEM_VERSIONING = OFF); DROP TABLE "post"\`);
    }

}`,
}
