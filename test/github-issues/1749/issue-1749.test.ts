import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Bar } from "./entity/Bar"

describe("github issues > #1749 Can't delete tables in non-default schema", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should delete entites from tables in different schemas", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const bar = new Bar()
                const persistedBar = await connection.manager.save(bar)

                await connection.manager.delete(Bar, persistedBar.id)
            }),
        ))
})
