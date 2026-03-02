import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { PersonSchema } from "./entity/Person"
import { PersonSchema2 } from "./entity/Person2"

describe("entity-schema > checks", () => {
    describe("entity-schema > checks > postgres, cockroachdb, oracle, mssql", () => {
        let dataSources: DataSource[]
        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [<any>PersonSchema],
                    enabledDrivers: [
                        "postgres",
                        "cockroachdb",
                        "oracle",
                        "mssql",
                    ],
                })),
        )
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should create a check constraints", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable("person")
                    await queryRunner.release()

                    table!.checks.length.should.be.equal(2)
                }),
            ))
    })

    describe("entity-schema > checks > spanner", () => {
        let dataSources: DataSource[]
        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [<any>PersonSchema2],
                    enabledDrivers: ["spanner"],
                })),
        )
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should create a check constraints", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable("person")
                    await queryRunner.release()

                    table!.checks.length.should.be.equal(2)
                }),
            ))
    })
})
