import { expect } from "chai"
import { DataSource } from "../../../src"
import { createTestingConnections } from "../../utils/test-utils"

describe("github issues > #9885", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["mongodb"],
        })
    })

    it("should be connected", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                expect(dataSource.isInitialized).true
            }),
        )
    })
})
