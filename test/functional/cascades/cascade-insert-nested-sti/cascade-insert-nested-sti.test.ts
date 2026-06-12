import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Parent } from "./entity/Parent"

describe("cascades > insert nested with STI", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should insert everything by cascades properly with intermediate STI", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const loadedParent = await dataSource
                    .getRepository(Parent)
                    .save({
                        name: "parent",
                        children: [
                            {
                                type: "one",
                                name: "child",
                                grandChildren: [
                                    {
                                        name: "grandchild",
                                    },
                                ],
                            },
                        ],
                    })

                expect(loadedParent).to.eql({
                    id: 1,
                    name: "parent",
                    children: [
                        {
                            id: 1,
                            type: "one",
                            name: "child",
                            grandChildren: [
                                {
                                    id: 1,
                                    name: "grandchild",
                                },
                            ],
                        },
                    ],
                })
            }),
        ))
})
