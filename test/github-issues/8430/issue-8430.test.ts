import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    reloadTestingDatabases,
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"

describe("github issues > #8430 sqlite temporary tables do not honor withoutRowid", () => {
    let dataSources: DataSource[] = []
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("should keep 'withoutRowid' after table recreation", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")

                expect(table!.withoutRowid).to.be.true

                const nameColumn = table!.findColumnByName("name")!
                const changedColumn = nameColumn.clone()
                changedColumn.name = "changedName"

                await queryRunner.changeColumn(
                    table!,
                    nameColumn,
                    changedColumn,
                )

                const changedTable = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(changedTable!.withoutRowid).to.be.true
            }),
        ))
})
