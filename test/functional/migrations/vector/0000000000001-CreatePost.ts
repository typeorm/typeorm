import { MigrationInterface } from "../../../../src/migration/MigrationInterface"
import { QueryRunner } from "../../../../src/query-runner/QueryRunner"

export class CreatePost0000000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE "post" (
                "id" SERIAL PRIMARY KEY,
                "embedding" vector,
                "embeddings" vector[]
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "post"`)
    }
}
