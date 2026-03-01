import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Test } from "./entity/Test"

describe("github issues > #7698 MariaDB STORED columns don't accept [NULL | NOT NULL]", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mariadb"],
            entities: [Test],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should not generate queries with NULL or NOT NULL for stored columns in mariadb", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                sqlInMemory.upQueries.length.should.be.greaterThan(0)
            }),
        ))
})
