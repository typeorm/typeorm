import { MigrationInterface } from "../../../src/migration/MigrationInterface"
import { QueryRunner } from "../../../src/query-runner/QueryRunner"

export class SecondReleaseMigration1481521933 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            "ALTER TABLE `post` CHANGE `name` `title` VARCHAR(500)",
        )
    }

    async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            "ALTER TABLE `post` CHANGE `title` `name` VARCHAR(255)",
        )
    }
}
