import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Item } from "./entity/Item"

describe("schema builder > column length", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Item],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: [
                "postgres",
                "cockroachdb",
                "mysql",
                "mariadb",
                "oracle",
                "mssql",
                "sap",
                "spanner",
                "better-sqlite3",
                "sqljs",
            ],
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("ignores unsupported lengths without schema drift", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("item")
                await queryRunner.release()
                const reference = table!.findColumnByName("reference")!

                if (dataSource.options.type === "mysql") {
                    expect(reference.type).to.equal("varchar")
                    expect(reference.length).to.equal("36")
                } else if (dataSource.options.type === "mariadb") {
                    expect(reference.type).to.equal("uuid")
                    expect(reference.length).to.equal("")
                } else if (dataSource.options.type === "postgres") {
                    expect(reference.type).to.equal("uuid")
                    expect(reference.length).to.equal("")
                }

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.have.length(0)
                expect(sqlInMemory.downQueries).to.have.length(0)
            }),
        ))
})
