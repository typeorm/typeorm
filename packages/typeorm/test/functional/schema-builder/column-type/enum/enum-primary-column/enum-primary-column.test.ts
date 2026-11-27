import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../../../../utils/test-utils"
import { AccessEvent } from "./entity/AccessEvent"
import { Employee } from "./entity/Employee"
import { expect } from "chai"

describe("schema builder > column type > enum > enum primary column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            migrations: [],
            enabledDrivers: ["mysql", "mariadb", "postgres"],
            schemaCreate: false,
            dropSchema: true,
            entities: [AccessEvent, Employee],
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should create tables with enum primary column", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.driver.createSchemaBuilder().build()
                const queryRunner = connection.createQueryRunner()

                // ManyToOne
                const table = await queryRunner.getTable("access_event")
                const column = table!.findColumnByName("employeeProvider")
                expect(column!.enum).to.deep.equal(["msGraph", "atlassian"])

                // ManyToMany
                const table2 = await queryRunner.getTable(
                    "access_event_employees_employee",
                )
                const column2 = table2!.findColumnByName("employeeProvider")
                expect(column2!.enum).to.deep.equal(["msGraph", "atlassian"])

                await queryRunner.release()
            }),
        ))
})
