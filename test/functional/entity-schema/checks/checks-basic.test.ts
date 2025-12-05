import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { PersonSchema } from "./entity/Person"
import { PersonSchema2 } from "./entity/Person2"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("entity-schema > checks", () => {
    describe("entity-schema > checks > postgres, cockroachdb, oracle, mssql", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [<any>PersonSchema],
                    enabledDrivers: [
                        "postgres",
                        "cockroachdb",
                        "oracle",
                        "mssql",
                    ],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should create a check constraints", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable("person")
                    await queryRunner.release()

                    table!.checks.length.should.be.equal(2)
                }),
            ))
    })

    describe("entity-schema > checks > spanner", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [<any>PersonSchema2],
                    enabledDrivers: ["spanner"],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should create a check constraints", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable("person")
                    await queryRunner.release()

                    table!.checks.length.should.be.equal(2)
                }),
            ))
    })
})
