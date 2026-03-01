import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { TestEntity1 } from "./entity/TestEntity1"

describe("github issues > #1504 Cannot eagerly query Entity with relation more than 3 levels deep", () => {
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

    it("should not throw an error", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.getRepository(TestEntity1).findOne({
                    where: {
                        id: 1,
                    },
                    relations: {
                        Entity2: {
                            Entity3: {
                                Entity4: true,
                            },
                        },
                    },
                })
            }),
        ))
})
