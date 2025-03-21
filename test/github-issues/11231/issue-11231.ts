import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #11231 Error trying to revert last migration when there is none on Oracle", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [],
                enabledDrivers: ["oracle"],
                migrations: [],
                schemaCreate: false,
                dropSchema: true,
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("should not throw when migrations list is empty", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.undoLastMigration()
                expect(await dataSource.destroy()).to.not.throw
            }),
        ))
})
