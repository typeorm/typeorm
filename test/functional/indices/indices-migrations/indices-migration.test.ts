import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"

// GitHub issue #5117: Table indexes needlessly recreated when generating migrations
describe("indices > indices migrations", () => {
    describe("detect indices creation", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: false,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should detect indices creation", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    sqlInMemory.upQueries.length.should.gt(0)
                    sqlInMemory.downQueries.length.should.gt(0)

                    sqlInMemory.upQueries.some((query) =>
                        query.query.includes("IDX_NAME_EMAIL"),
                    ).should.be.true
                    sqlInMemory.upQueries.some((query) =>
                        query.query.includes("IDX_CHOICE"),
                    ).should.be.true
                    sqlInMemory.upQueries.some((query) =>
                        query.query.includes("IDX_USER_ID_CHOICE"),
                    ).should.be.true
                }),
            ))
    })

    describe("no changes in indices", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should detect no changes in indices", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    sqlInMemory.upQueries.length.should.eql(0)
                    sqlInMemory.downQueries.length.should.eql(0)
                }),
            ))
    })
})
