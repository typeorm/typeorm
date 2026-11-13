import { expect } from "chai"
import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import {
    MultiIdNested,
    SingleIdNested,
} from "../../update-remove/entity/RemainingTreeEntities"

// Regression for #12903: overlapping removals must close each subtree only once.
describe("tree-tables > nested-set > overlapping remove", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [SingleIdNested, MultiIdNested],
            disabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    for (const entity of [SingleIdNested, MultiIdNested]) {
        for (const childFirst of [false, true]) {
            it(`should close each removed subtree once for ${entity.name}, child first: ${childFirst}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const repository = dataSource.getTreeRepository<
                            SingleIdNested | MultiIdNested
                        >(entity)
                        const root = await repository.save(
                            repository.create({
                                name: "root",
                                column: "root",
                                row: 1,
                            }),
                        )
                        const branch = await repository.save(
                            repository.create({
                                name: "branch",
                                column: "branch",
                                row: 2,
                                parent: root,
                            }),
                        )
                        const child = await repository.save(
                            repository.create({
                                name: "child",
                                column: "child",
                                row: 3,
                                parent: branch,
                            }),
                        )
                        const survivor = await repository.save(
                            repository.create({
                                name: "survivor",
                                column: "survivor",
                                row: 4,
                                parent: root,
                            }),
                        )
                        const survivorChild = await repository.save(
                            repository.create({
                                name: "survivor child",
                                column: "survivor_child",
                                row: 5,
                                parent: survivor,
                            }),
                        )
                        const otherRemoved = await repository.save(
                            repository.create({
                                name: "other removed",
                                column: "other_removed",
                                row: 6,
                                parent: root,
                            }),
                        )

                        await repository.remove(
                            childFirst
                                ? [child, branch, otherRemoved]
                                : [otherRemoved, branch, child],
                        )

                        const bounds = await repository
                            .createQueryBuilder("category")
                            .select("category.name", "name")
                            .addSelect(
                                `category.${repository.metadata.nestedSetLeftColumn!.propertyPath}`,
                                "left",
                            )
                            .addSelect(
                                `category.${repository.metadata.nestedSetRightColumn!.propertyPath}`,
                                "right",
                            )
                            .orderBy(
                                `category.${repository.metadata.nestedSetLeftColumn!.propertyPath}`,
                            )
                            .getRawMany()

                        expect(
                            bounds.map((bound) => ({
                                name: bound.name,
                                left: Number(bound.left),
                                right: Number(bound.right),
                            })),
                        ).to.deep.equal([
                            { name: root.name, left: 1, right: 6 },
                            { name: survivor.name, left: 2, right: 5 },
                            { name: survivorChild.name, left: 3, right: 4 },
                        ])
                        expect(
                            (await repository.findDescendants(root)).map(
                                (category) => category.name,
                            ),
                        ).to.have.members([
                            root.name,
                            survivor.name,
                            survivorChild.name,
                        ])
                        expect(
                            (await repository.findAncestors(survivorChild)).map(
                                (category) => category.name,
                            ),
                        ).to.have.members([
                            root.name,
                            survivor.name,
                            survivorChild.name,
                        ])
                        await repository.save(
                            repository.create({
                                name: "new sibling",
                                column: "new_sibling",
                                row: 7,
                                parent: root,
                            }),
                        )
                        expect(
                            (
                                await repository.findDescendants(survivorChild)
                            ).map((category) => category.name),
                        ).to.have.members([survivorChild.name])
                    }),
                ))
        }
    }
})
