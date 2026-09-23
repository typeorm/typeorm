import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../../../../utils/test-utils"
import { DefaultUpdateDate } from "./entity/default-update-date"

describe("schema builder > column type > datetime > ON UPDATE clause", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            migrations: [],
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: false,
            dropSchema: true,
            entities: [DefaultUpdateDate],
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should create migration with default ON UPDATE clause", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                sqlInMemory.upQueries
                    .filter((i) => i.query.includes("ON UPDATE"))
                    .length.should.be.greaterThan(0)
            }),
        ))
})
