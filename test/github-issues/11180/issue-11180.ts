import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

import { Parent } from "./entity/parent"

describe("github issues > #11180 OneToOne relation creates invalid query", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not throw error when loading entities with relations using EntityManager", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(Parent)
                    .find({ relations: ["child"] })
            }),
        ))
})
