import { createTestingConnections } from "../../../utils/test-utils"
import type { MigrationInterface, QueryRunner } from "../../../../src"
import { expect } from "chai"

describe("preserveForeignKeysDuringMigrations option", () => {
    let foreignKeysDuringMigration: number | undefined = undefined

    class Migration1000000000000 implements MigrationInterface {
        async up(queryRunner: QueryRunner): Promise<void> {
            const result = await queryRunner.query("PRAGMA FOREIGN_KEYS")
            foreignKeysDuringMigration = result[0].foreign_keys
        }

        down(_queryRunner: QueryRunner): Promise<never> {
            throw new Error("Method not implemented.")
        }
    }

    beforeEach(() => {
        foreignKeysDuringMigration = undefined
    })

    it("should turn off foreign keys by default", async () => {
        const connections = await createTestingConnections({
            enabledDrivers: ["better-sqlite3"],
            migrations: [Migration1000000000000],
            dropSchema: true,
        })

        await connections[0].runMigrations()
        expect(foreignKeysDuringMigration).to.equal(0)
    })

    it("should preserve foreign keys when enabled", async () => {
        const connections = await createTestingConnections({
            enabledDrivers: ["better-sqlite3"],
            migrations: [Migration1000000000000],
            dropSchema: true,
            driverSpecific: {
                preserveForeignKeysDuringMigrations: true,
            },
        })

        await connections[0].runMigrations()
        expect(foreignKeysDuringMigration).to.equal(1)
    })
})
