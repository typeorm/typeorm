import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Settings } from "./entity/Settings"
import { expect } from "chai"

describe("github issues > #3874 Using an (empty string) enum as the type of a primary key column", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Settings],
                enabledDrivers: ["mysql", "mariadb"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should reload entity", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // Create initial settings row
                const newSettings = new Settings()
                newSettings.value = "string"
                await connection.manager.save(newSettings)
                // Attempt to read settings back
                const foundSettings = await connection.manager.findOne(
                    Settings,
                    {
                        where: {
                            singleton: newSettings.singleton,
                        },
                    },
                )
                expect(foundSettings).to.be.an.instanceOf(Settings)
                expect(
                    foundSettings != null ? foundSettings.value : null,
                ).to.equal("string")
            }),
        ))
})
