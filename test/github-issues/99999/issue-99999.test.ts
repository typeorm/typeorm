import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > sqlite multi-line CONSTRAINT clauses parse correctly", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            migrations: [__dirname + "/migrations/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3", "sqljs"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should preserve FOREIGN KEY / UNIQUE / CHECK constraint names when their clauses span multiple lines in CREATE TABLE", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.runMigrations()
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table).to.exist

                const fk = table!.foreignKeys.find(
                    (it) => it.referencedTableName === "author",
                )
                expect(fk, "FK on author should be parsed").to.exist
                expect(fk!.name).to.equal("FK_post_authorId")

                const unique = table!.uniques.find((it) =>
                    it.columnNames.includes("slug"),
                )
                expect(unique, "UNIQUE on slug should be parsed").to.exist
                expect(unique!.name).to.equal("UQ_post_slug")

                const check = table!.checks.find(
                    (it) => it.name === "CHK_post_slug",
                )
                expect(check, "CHECK CHK_post_slug should be parsed").to.exist
            }),
        ))
})
