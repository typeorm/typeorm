import "reflect-metadata"
import { expect } from "chai"
import { Category } from "./entity/Category"
import { RenamedCategory } from "./entity/RenamedCategory"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("tree-tables > closure-table > custom primary column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Category, RenamedCategory],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // Regression for #12904: renamed primary columns must not leave stale links.
    for (const destination of ["other root", "same tree", "root"] as const) {
        it(`should remove old ancestry when moving a branch to ${destination} with a renamed primary column`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository =
                        dataSource.getTreeRepository(RenamedCategory)
                    const oldParent = await repository.save({ cat_name: "old" })
                    const newParent = await repository.save({
                        cat_name: "new",
                        parent: destination === "same tree" ? oldParent : null,
                    })
                    const branch = await repository.save(
                        repository.create({
                            cat_name: "branch",
                            parent: oldParent,
                        }),
                    )
                    const leaf = await repository.save({
                        cat_name: "leaf",
                        parent: branch,
                    })

                    branch.parent = destination === "root" ? null : newParent
                    await repository.save(branch)

                    const ancestors = await repository.findAncestors(leaf)
                    const expectedAncestors = [branch.cat_id, leaf.cat_id]
                    if (destination !== "root") {
                        expectedAncestors.push(newParent.cat_id)
                    }
                    if (destination === "same tree") {
                        expectedAncestors.push(oldParent.cat_id)
                    }
                    expect(
                        ancestors.map((category) => category.cat_id),
                    ).to.have.members(expectedAncestors)

                    expect(await repository.count()).to.equal(4)
                    const junction = repository.metadata.closureJunctionTable
                    const closureCount = await dataSource
                        .createQueryBuilder()
                        .select("COUNT(*)", "count")
                        .from(junction.tablePath, "closure")
                        .getRawOne()
                    const expectedClosureCounts = {
                        "other root": 7,
                        "same tree": 10,
                        root: 5,
                    }
                    expect(Number(closureCount.count)).to.equal(
                        expectedClosureCounts[destination],
                    )
                }),
            ))
    }

    it("should persist and retrieve tree with custom primary column names", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const categoryRepository =
                    connection.getTreeRepository(Category)

                const parent = new Category()
                parent.cat_name = "parent"
                await categoryRepository.save(parent)

                const child = new Category()
                child.cat_name = "child"
                child.parent = parent
                await categoryRepository.save(child)

                const tree = await categoryRepository.findDescendantsTree(
                    (await categoryRepository.findOneBy({
                        cat_name: "parent",
                    }))!,
                )

                tree.should.deep.include({
                    cat_id: 1,
                    cat_name: "parent",
                    children: [
                        {
                            cat_id: 2,
                            cat_name: "child",
                            children: [],
                        },
                    ],
                })
            }),
        ))
})
