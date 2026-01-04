import { MigrationInterface } from "../../../../src"

export class FailMigration1530542855524 implements MigrationInterface {
    public async up() {
        throw new Error("migration error")
    }

    public async down() {
        throw new Error("migration error")
    }
}
