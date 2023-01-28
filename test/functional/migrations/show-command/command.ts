import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"

describe("migrations > show command", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                migrations: [__dirname + "/migration/*.js"],
                enabledDrivers: ["postgres", "sqlite"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("can recognise pending migrations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const migrations = await connection.showMigrations()
                migrations.should.be.equal(true)
            }),
        ))

    it("can recognise no pending migrations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const m = await connection.runMigrations()
                /*
                    .catch((err) => { console.log(`error: ${err}`)})
                    .then(() => { console.log('migrations done')})
                */
                console.log(`have performe ${m.length} migrations`)
                const migrations = await connection.showMigrations()
                migrations.should.be.equal(false)
            }),
        ))
})
