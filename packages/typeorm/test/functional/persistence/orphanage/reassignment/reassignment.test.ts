import "reflect-metadata"
import { expect } from "chai"
import { EntitySchema } from "../../../../../src"
import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

interface Parent {
    id: number
    children: Child[]
    otherChildren?: Child[]
}

interface Child {
    id: number
    scope: number
    parentId: number | null
    parent?: Parent
    otherParent?: Parent
    deletedAt: Date | null
}

describe("persistence > orphanage > reassignment", () => {
    // Regression coverage for github issue #12888.
    const policies = [
        { name: "default with required FK", nullable: false },
        { name: "default with nullable FK", nullable: true },
        { name: "delete", nullable: false, orphanedRowAction: "delete" },
        {
            name: "soft-delete",
            nullable: false,
            orphanedRowAction: "soft-delete",
        },
    ] as const

    for (const policy of policies) {
        for (const composite of [false, true]) {
            for (const cascade of [false, true]) {
                describe(
                    policy.name +
                        ", composite=" +
                        composite +
                        ", cascade=" +
                        cascade,
                    () => {
                        let dataSources: DataSource[] = []
                        const parentSchema = new EntitySchema<Parent>({
                            name: "ReassignmentParent",
                            columns: {
                                id: {
                                    type: Number,
                                    primary: true,
                                    generated: true,
                                },
                            },
                            relations: {
                                children: {
                                    type: "one-to-many",
                                    target: "ReassignmentChild",
                                    inverseSide: "parent",
                                    cascade,
                                },
                                otherChildren: {
                                    type: "one-to-many",
                                    target: "ReassignmentChild",
                                    inverseSide: "otherParent",
                                },
                            },
                        })
                        const childSchema = new EntitySchema<Child>({
                            name: "ReassignmentChild",
                            columns: {
                                id: { type: Number, primary: true },
                                scope: { type: Number, primary: composite },
                                parentId: {
                                    type: Number,
                                    nullable: policy.nullable,
                                },
                                deletedAt: { type: Date, deleteDate: true },
                            },
                            relations: {
                                parent: {
                                    type: "many-to-one",
                                    target: "ReassignmentParent",
                                    inverseSide: "children",
                                    joinColumn: { name: "parentId" },
                                    nullable: policy.nullable,
                                    ...("orphanedRowAction" in policy
                                        ? {
                                              orphanedRowAction:
                                                  policy.orphanedRowAction,
                                          }
                                        : {}),
                                },
                                otherParent: {
                                    type: "many-to-one",
                                    target: "ReassignmentParent",
                                    inverseSide: "otherChildren",
                                    nullable: true,
                                },
                            },
                        })

                        before(async () => {
                            dataSources = await createTestingConnections({
                                entities: [parentSchema, childSchema],
                                disabledDrivers: ["mongodb"],
                            })
                        })
                        beforeEach(() => reloadTestingDatabases(dataSources))
                        after(() => closeTestingConnections(dataSources))

                        async function seed(dataSource: DataSource) {
                            const parents =
                                dataSource.getRepository(parentSchema)
                            const children =
                                dataSource.getRepository(childSchema)
                            const source = await parents.save(parents.create())
                            const destination = await parents.save(
                                parents.create(),
                            )
                            await children.save({
                                id: 1,
                                scope: 1,
                                parentId: source.id,
                            })
                            if (composite) {
                                await children.save({
                                    id: 1,
                                    scope: 2,
                                    parentId: source.id,
                                })
                            }
                            return { parents, children, source, destination }
                        }

                        for (const reverse of [false, true]) {
                            it(
                                "preserves a reassigned child, reverse save order=" +
                                    reverse,
                                async () => {
                                    for (const dataSource of dataSources) {
                                        const {
                                            parents,
                                            children,
                                            source,
                                            destination,
                                        } = await seed(dataSource)
                                        const loadedSource =
                                            await parents.findOneOrFail({
                                                where: { id: source.id },
                                                relations: { children: true },
                                            })
                                        const movedChild =
                                            loadedSource.children.find(
                                                (child) => child.scope === 1,
                                            )!
                                        loadedSource.children =
                                            loadedSource.children.filter(
                                                (child) => child.scope !== 1,
                                            )
                                        destination.children = [movedChild]
                                        const batch = reverse
                                            ? [destination, loadedSource]
                                            : [loadedSource, destination]
                                        await parents.save(batch)

                                        const moved =
                                            await children.findOneByOrFail({
                                                id: 1,
                                                scope: 1,
                                            })
                                        expect(moved.parentId).to.equal(
                                            destination.id,
                                        )
                                        expect(moved.deletedAt).to.equal(null)
                                        if (composite) {
                                            const retained =
                                                await children.findOneByOrFail({
                                                    id: 1,
                                                    scope: 2,
                                                })
                                            expect(retained.parentId).to.equal(
                                                source.id,
                                            )
                                        }
                                    }
                                },
                            )
                        }

                        it("preserves a child moved by a distinct ID object to a new parent", async () => {
                            for (const dataSource of dataSources) {
                                const { parents, children, source } =
                                    await seed(dataSource)
                                const destination = parents.create({
                                    children: [{ id: 1, scope: 1 }],
                                })
                                await parents.save([
                                    {
                                        id: source.id,
                                        children: composite
                                            ? [{ id: 1, scope: 2 }]
                                            : [],
                                    },
                                    destination,
                                ])
                                const moved = await children.findOneByOrFail({
                                    id: 1,
                                    scope: 1,
                                })
                                expect(moved.parentId).to.equal(destination.id)
                                expect(moved.deletedAt).to.equal(null)
                            }
                        })

                        it("still applies the orphan policy when the child only joins a different relation", async () => {
                            for (const dataSource of dataSources) {
                                const {
                                    parents,
                                    children,
                                    source,
                                    destination,
                                } = await seed(dataSource)
                                await parents.save([
                                    { id: source.id, children: [] },
                                    {
                                        id: destination.id,
                                        otherChildren: [{ id: 1, scope: 1 }],
                                    },
                                ])
                                const orphan = await children.findOne({
                                    where: { id: 1, scope: 1 },
                                    withDeleted: true,
                                })
                                if (policy.name === "soft-delete") {
                                    expect(orphan!.deletedAt).to.be.instanceOf(
                                        Date,
                                    )
                                } else if (policy.nullable) {
                                    expect(orphan!.parentId).to.equal(null)
                                } else {
                                    expect(orphan).to.equal(null)
                                }
                            }
                        })
                    },
                )
            }
        }
    }
})
