import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"
import { GrandChild } from "./entity/GrandChild"

describe("cascades > traversal scope", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            __dirname,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("save should not cascade-insert children through cascade: ['remove'] relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parent = new Parent()
                parent.name = "parent"
                parent.children = [
                    Object.assign(new Child(), { name: "child-1" }),
                    Object.assign(new Child(), { name: "child-2" }),
                ]

                // save parent with children — since the relation only has
                // cascade: ["remove"], the children should NOT be inserted
                await dataSource.manager.save(parent)

                // parent should be saved
                const savedParent = await dataSource.manager.findOneByOrFail(
                    Parent,
                    { id: parent.id },
                )
                expect(savedParent.name).to.equal("parent")

                // children should NOT have been cascade-inserted
                const children = await dataSource.manager.find(Child)
                expect(children).to.have.length(0)
            }),
        ))

    it("save should not cascade-insert grandchildren through cascade: ['remove'] → cascade: ['insert'] chain", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Parent → Child has cascade: ["remove"]
                // Child → GrandChild has cascade: ["insert"]
                // save(parent) should NOT reach GrandChild through the
                // remove-only Parent→Child link
                const grandChild = Object.assign(new GrandChild(), {
                    name: "gc-1",
                })
                const child = Object.assign(new Child(), {
                    name: "child-1",
                    grandChildren: [grandChild],
                })
                const parent = new Parent()
                parent.name = "parent"
                parent.children = [child]

                await dataSource.manager.save(parent)

                // parent saved, but neither child nor grandchild should exist
                const children = await dataSource.manager.find(Child)
                expect(children).to.have.length(0)

                const grandChildren = await dataSource.manager.find(GrandChild)
                expect(grandChildren).to.have.length(0)
            }),
        ))

    it("remove should cascade-remove children through cascade: ['remove'] relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // manually insert parent and children
                const child1 = Object.assign(new Child(), { name: "child-1" })
                const child2 = Object.assign(new Child(), { name: "child-2" })
                await dataSource.manager.save(Child, [child1, child2])

                const parent = new Parent()
                parent.name = "parent"
                await dataSource.manager.save(parent)

                // link children to parent via direct update
                await dataSource.manager.update(Child, child1.id, {
                    parent: parent,
                })
                await dataSource.manager.update(Child, child2.id, {
                    parent: parent,
                })

                // reload parent with children for remove
                const loadedParent = await dataSource.manager.findOneOrFail(
                    Parent,
                    {
                        where: { id: parent.id },
                        relations: { children: true },
                    },
                )
                expect(loadedParent.children).to.have.length(2)

                // remove should cascade to children
                await dataSource.manager.remove(loadedParent)

                const remainingChildren = await dataSource.manager.find(Child)
                expect(remainingChildren).to.have.length(0)
            }),
        ))
})
