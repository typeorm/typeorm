import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DefaultUpdateDate } from "./entity/default-update-date"

describe("github issues > #6995 Generating migrations for UpdateDateColumn should generate on update clause", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            migrations: [],
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: false,
            dropSchema: true,
            entities: [DefaultUpdateDate],
        })
    })
    afterAll(() => closeTestingConnections(dataSources))

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
