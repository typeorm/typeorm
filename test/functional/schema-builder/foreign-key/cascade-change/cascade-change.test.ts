import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    setupSingleTestingConnection,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src"
import { expect } from "chai"

describe("schema builder > foreign key > cascade option change (issue #1986)", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/v1/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections([...dataSources]))

    it("should NOT generate migration when cascade: true is added (ORM-level only, not database FK)", () =>
        Promise.all(
            dataSources.map(async function (dataSource) {
                const options = setupSingleTestingConnection(
                    dataSource.options.type,
                    {
                        entities: [__dirname + "/entity/v2/*{.js,.ts}"],
                        dropSchema: false,
                        schemaCreate: false,
                    },
                )!
                const newDataSource = new DataSource(options)
                await newDataSource.initialize()

                try {
                    const sqlInMemory = await newDataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQueries = sqlInMemory.upQueries.map(
                        (query) => query.query,
                    )

                    expect(upQueries.length).to.equal(0)
                } finally {
                    await newDataSource.destroy()
                }
            }),
        ))

    it("should generate migration when onDelete: CASCADE is explicitly added to existing relation (owning side)", () =>
        Promise.all(
            dataSources.map(async function (dataSource) {
                const options = setupSingleTestingConnection(
                    dataSource.options.type,
                    {
                        entities: [__dirname + "/entity/v3/*{.js,.ts}"],
                        dropSchema: false,
                        schemaCreate: false,
                    },
                )!
                const newDataSource = new DataSource(options)
                await newDataSource.initialize()

                try {
                    const sqlInMemory = await newDataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQueries = sqlInMemory.upQueries.map(
                        (query) => query.query,
                    )

                    expect(upQueries.length).to.be.greaterThan(0)

                    const dropQuery = upQueries.find((q) =>
                        q.match(/ALTER TABLE [`"]?post[`"]? DROP FOREIGN KEY/),
                    )
                    const createQuery = upQueries.find((q) =>
                        q.match(
                            /ALTER TABLE [`"]?post[`"]?.*ADD.*CONSTRAINT.*ON DELETE CASCADE/,
                        ),
                    )

                    expect(dropQuery).to.exist
                    expect(createQuery).to.exist
                } finally {
                    await newDataSource.destroy()
                }
            }),
        ))
})
