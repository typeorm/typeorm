import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #1758 Synchronization bug in PostgreSQL bug occurs when we explicitly state the default schema as 'public'", () => {
    describe("postgres, cockroachdb", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres", "cockroachdb"],
                schema: "public",
                schemaCreate: true,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should correctly synchronize schema when we explicitly state the default schema as 'public'", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    await connection.synchronize()
                }),
            ))
    })

    describe("mssql", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mssql"],
                schema: "dbo",
                schemaCreate: true,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should correctly synchronize schema when we explicitly state the default schema as 'public'", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    await connection.synchronize()
                }),
            ))
    })
})
