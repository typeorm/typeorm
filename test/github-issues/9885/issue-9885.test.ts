import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #9885", () => {
    let dataSources: DataSource[]

    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["mongodb"],
        })
    })
    afterAll(() => closeTestingConnections(dataSources))

    it("should be connected", () => {
        dataSources.forEach((dataSource) => {
            expect(dataSource.isInitialized).true
        })
    })
})
