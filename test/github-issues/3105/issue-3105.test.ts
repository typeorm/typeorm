import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource, EntityManager } from "../../../src"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("github issues > #3105 Error with cascading saves using EntityManager in a transaction", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it.skipIf(() => connections.length === 0).fails(
        "error with cascading saves using EntityManager in a transaction",
        () =>
            () =>
                Promise.all(
                    connections.map(async function (connection) {
                        let findChildOne
                        let findChildTwo

                        await expect(
                            connection.manager.transaction(
                                async (
                                    transactionalEntityManager: EntityManager,
                                ) => {
                                    const parent = new Parent()
                                    parent.children = [
                                        new Child(1),
                                        new Child(2),
                                    ]

                                    let newParent =
                                        await transactionalEntityManager.save(
                                            parent,
                                        )

                                    newParent.children = [
                                        new Child(4),
                                        new Child(5),
                                    ]
                                    newParent =
                                        await transactionalEntityManager.save(
                                            parent,
                                        )

                                    // Check that the correct children are persisted with the parent.
                                    findChildOne = newParent.children.find(
                                        (child) => {
                                            return child.data === 4
                                        },
                                    )

                                    findChildTwo = newParent.children.find(
                                        (child) => {
                                            return child.data === 5
                                        },
                                    )
                                },
                            ),
                        ).not.to.be.rejected

                        expect(findChildOne).to.not.equal(undefined)
                        expect(findChildTwo).to.not.equal(undefined)
                    }),
                ),
        )
})
