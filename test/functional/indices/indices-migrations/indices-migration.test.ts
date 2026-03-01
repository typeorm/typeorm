import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"

describe("indices > indices migrations", () => {
    describe("detect indices creation (#5117)", () => {
        let dataSources: DataSource[]
        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    schemaCreate: false,
                    dropSchema: true,
                })),
        )
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

    describe("no changes in indices (#5117)", () => {
        let dataSources: DataSource[]
        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    schemaCreate: true,
                    dropSchema: true,
                })),
        )
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
