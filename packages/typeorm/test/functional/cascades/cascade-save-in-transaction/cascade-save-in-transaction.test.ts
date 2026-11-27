import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource, EntityManager } from "../../../../src"
import { In } from "../../../../src"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"
import { expect } from "chai"

describe("cascades > save in transaction", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should save with cascading using EntityManager in a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = new Parent()
                parent.children = [new Child(1), new Child(2)]
                let firstChildIds: number[] = []

                await expect(
                    dataSource.manager.transaction(
                        async (transactionalEntityManager: EntityManager) => {
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

                // Verify final state after transaction
                const loadedParent = await parentRepo.findOneOrFail({
                    where: { id: parent.id },
                    relations: { children: true },
                })

                expect(loadedParent.children).to.have.length(2)
                expect(
                    loadedParent.children.map((c) => c.data),
                ).to.include.members([4, 5])

                // Orphaned children should be deleted (FK is non-nullable)
                const orphanedChildren = await childRepo.find({
                    where: { id: In(firstChildIds) },
                })
                expect(orphanedChildren).to.be.empty

                // Verify no other unexpected rows exist
                const allChildrenCount = await childRepo.count()
                expect(allChildrenCount).to.equal(2)
            }),
        ))
})
