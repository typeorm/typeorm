import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ExampleEntity } from "./entity/ExampleEntity"

describe("github issues > #9927 aggregate function throw error when column alias name is set", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [ExampleEntity],
            enabledDrivers: ["mariadb"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should call `maximum` method successfully", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.maximum(
                    ExampleEntity,
                    "serialNoId",
                    {},
                )
            }),
        )
    })

    it("should call `minimum` method successfully", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.minimum(
                    ExampleEntity,
                    "serialNoId",
                    {},
                )
            }),
        )
    })

    it("should call `sum` method successfully", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.sum(ExampleEntity, "serialNoId", {})
            }),
        )
    })

    it("should call `average` method successfully", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.average(
                    ExampleEntity,
                    "serialNoId",
                    {},
                )
            }),
        )
    })
})
