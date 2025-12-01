import { MigrationInterface } from "../../../../src/migration/MigrationInterface"
import { QueryRunner } from "../../../../src/query-runner/QueryRunner"
import { User } from "../entity/user"

export class InsertUser0000000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner) {
        const userRepo = queryRunner.connection.getRepository<User>(User)
        return userRepo.save(new User())
    }

    public async down() {}
}
