import { MigrationInterface } from "../../../../src/migration/MigrationInterface"
import { QueryRunner } from "../../../../src/query-runner/QueryRunner"

export class CreatePost0000000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE "post" (
                "id" SERIAL PRIMARY KEY,
                "embedding" vector,
                "embedding_three_dimensions" vector(3),
                "halfvec_embedding" halfvec,
                "halfvec_four_dimensions" halfvec(4)
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "post"`)
    }
}
