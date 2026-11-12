import { expect } from "chai"
import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Note } from "./entity/Note"

// GitHub issue #13042 - a string default containing a single quote produced invalid DDL
describe("schema builder > idempotency > string default with a single quote", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Note],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: [
                "better-sqlite3",
                "cockroachdb",
                "mariadb",
                "mssql",
                "mysql",
                "postgres",
                "sap",
                "sqljs",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create the table and apply the escaped default", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Note)
                    .values({ id: 1 })
                    .execute()

                const note = await dataSource
                    .getRepository(Note)
                    .findOneByOrFail({ id: 1 })
                expect(note.status).to.equal("won't fix")
            }),
        ))

    it("should not detect a schema change for the default", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.be.empty
                expect(sqlInMemory.downQueries).to.be.empty
            }),
        ))
})
