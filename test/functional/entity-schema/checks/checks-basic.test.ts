import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { PersonSchema } from "./entity/Person"
import { PersonSchema2 } from "./entity/Person2"

describe("entity-schema > checks", () => {
    describe("entity-schema > checks > postgres, cockroachdb, oracle, mssql", () => {
        let dataSources: DataSource[]
        beforeAll(async () => {
            dataSources = await createTestingConnections({
                entities: [<any>PersonSchema],
                enabledDrivers: ["postgres", "cockroachdb", "oracle", "mssql"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        afterAll(() => closeTestingConnections(dataSources))

        it("should create a check constraints", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable("person")
                    await queryRunner.release()

                    table!.checks.length.should.be.equal(2)
                }),
            ))
    })

    describe("entity-schema > checks > spanner", () => {
        let dataSources: DataSource[]
        beforeAll(async () => {
            dataSources = await createTestingConnections({
                entities: [<any>PersonSchema2],
                enabledDrivers: ["spanner"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        afterAll(() => closeTestingConnections(dataSources))

        it("should create a check constraints", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable("person")
                    await queryRunner.release()

                    table!.checks.length.should.be.equal(2)
                }),
            ))
    })
})
