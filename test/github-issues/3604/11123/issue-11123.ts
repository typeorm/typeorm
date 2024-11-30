import "reflect-metadata"
import { DataSource,EntityManager } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Example } from "./entity/Example"
import { expect } from "chai"



describe("github issues > #11123 SNAPSHOT isolation level support", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Example], 
                enabledDrivers: ["mssql"], 
                driverSpecific: {
                    options: {
                        isolation: "SNAPSHOT", 
                    },
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections)) 
    after(() => closeTestingConnections(connections)) 

    it("should run transactions with SNAPSHOT isolation level by default", () =>
        Promise.all(
            connections.map(async (connection) => {
                let isolationLevel: number | undefined

                await connection.transaction(async (manager:EntityManager) => {
                    const example = new Example()
                    example.name = "Test Example"

                    await manager.save(example)

                    const result = await manager.query(`
                        SELECT transaction_isolation_level
                        FROM sys.dm_exec_sessions
                        WHERE session_id = @@SPID
                    `)

                    isolationLevel = result[0].transaction_isolation_level
                })

                expect(isolationLevel).to.equal(5)
            }),
        ))

    it("should allow explicitly setting SNAPSHOT isolation level for a transaction", () =>
        Promise.all(
            connections.map(async (connection) => {
                let isolationLevel: number | undefined

                await connection.transaction("SNAPSHOT", async (manager) => {
                    const example = new Example()
                    example.name = "Another Example"

                    await manager.save(example)

                    const result = await manager.query(`
                        SELECT transaction_isolation_level
                        FROM sys.dm_exec_sessions
                        WHERE session_id = @@SPID
                    `)

                    isolationLevel = result[0].transaction_isolation_level
                })
                expect(isolationLevel).to.equal(5)
            }),
        ))
})