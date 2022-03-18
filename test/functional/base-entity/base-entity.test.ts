import "../../utils/test-setup"
import { setupTestingConnections } from "../../utils/test-utils"
import { User } from "./entity/User"
import { expect } from "chai"
import { DataSource } from "../../../src"

describe("base entity", () => {
    it("test if DataSource calls `useDataSource` of the provided entities", async () => {
        const dataSourceOptions = setupTestingConnections({
            entities: [User],
            enabledDrivers: ["sqlite"],
        })
        if (!dataSourceOptions.length) return

        const dataSource = new DataSource(dataSourceOptions[0])
        await dataSource.initialize()
        await dataSource.synchronize(true)

        await User.save({ name: "Timber Saw" })
        const timber = await User.findOneByOrFail({ name: "Timber Saw" })
        expect(timber).to.be.eql({
            id: 1,
            name: "Timber Saw",
        })
    })
})
