import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    setupSingleTestingConnection,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
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

describe("github issues > #5119 migration with foreign key that changes target", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/v1/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections([...dataSources]))

    it("should generate a drop and create step", () =>
        Promise.all(
            dataSources.map(async function (dataSource) {
                const options = setupSingleTestingConnection(
                    dataSource.options.type,
                    {
                        name: `${dataSource.name}-v2`,
                        entities: [__dirname + "/entity/v2/*{.js,.ts}"],
                        dropSchema: false,
                        schemaCreate: false,
                    },
                )!
                const newDataSource = new DataSource(options)
                await newDataSource.initialize()
                const sqlInMemory = await newDataSource.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map(
                    (query) => query.query,
                )
                const downQueries = sqlInMemory.downQueries.map(
                    (query) => query.query,
                )
                upQueries.should.eql([
                    `ALTER TABLE "post" DROP CONSTRAINT "FK_4490d00e1925ca046a1f52ddf04"`,
                    `CREATE TABLE "account" ("id" SERIAL NOT NULL, "userId" integer, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`,
                    `ALTER TABLE "account" ADD CONSTRAINT "FK_60328bf27019ff5498c4b977421" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
                    `ALTER TABLE "post" ADD CONSTRAINT "FK_4490d00e1925ca046a1f52ddf04" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
                ])
                downQueries.should.eql([
                    `ALTER TABLE "post" ADD CONSTRAINT "FK_4490d00e1925ca046a1f52ddf04" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
                    `DROP TABLE "account"`,
                    `ALTER TABLE "account" DROP CONSTRAINT "FK_60328bf27019ff5498c4b977421"`,
                    `ALTER TABLE "post" DROP CONSTRAINT "FK_4490d00e1925ca046a1f52ddf04"`,
                ])

                await newDataSource.destroy()
            }),
        ))
})
