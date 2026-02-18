import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource, EntityManager, In } from "../../../src"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"
import { expect } from "chai"

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

    it("should save with cascading using EntityManager in a transaction", () =>
        Promise.all(
            connections.map(async function (connection) {
                const parentRepo = connection.getRepository(Parent)
                const childRepo = connection.getRepository(Child)

                let firstChildIds: number[] = []

                await expect(
                    connection.manager.transaction(
                        async (transactionalEntityManager: EntityManager) => {
                            const parent = new Parent()
                            parent.children = [new Child(1), new Child(2)]

                            await transactionalEntityManager.save(parent)
                            firstChildIds = parent.children.map(
                                (child) => child.id,
                            )

                            // Replace children to orphan the previous ones
                            parent.children = [new Child(4), new Child(5)]
                            await transactionalEntityManager.save(parent)
                        },
                    ),
                ).not.to.be.rejected

                // Additional DB assertions to verify orphan handling
                const loadedParent = await parentRepo.findOne({
                    where: { id: 1 },
                    relations: ["children"],
                })

                expect(loadedParent).not.to.be.null
                expect(loadedParent!.children).to.have.length(2)
                expect(
                    loadedParent!.children.map((c) => c.data),
                ).to.include.members([4, 5])

                // validate that orphaned children are removed from the database
                // since parent_id is non-nullable, TypeORM should delete them
                const orphanedChildren = await childRepo.find({
                    where: {
                        id: In(firstChildIds),
                    },
                })
                expect(orphanedChildren).to.be.empty

                // verify no other unexpected rows exist
                const allChildrenCount = await childRepo.count()
                expect(allChildrenCount).to.equal(2)
            }),
        ))
})
