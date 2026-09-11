import "reflect-metadata"
import { expect } from "chai"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"

describe("github issues > #11773 cascade nulls FK for bigint relations on parent save", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Parent, Child],
            // This bug is specific to drivers that return bigint columns as
            // strings (MySQL / MariaDB): the DB-loaded child id ("1") and the
            // in-memory id (1) then compare unequal, so the persisted child
            // looks removed and its FK is nulled.
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("keeps the child's FK when re-saving a parent whose bigint child id is a number in memory", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                // Seed a parent with one child (cascade insert).
                const parent = new Parent()
                parent.id = 1
                const child = new Child()
                child.id = 1
                parent.children = [child]
                await manager.save(parent)

                // Re-save the same object graph. The child id is a JS number
                // in memory, but MySQL/MariaDB return the persisted bigint as
                // the string "1"; before the fix the OneToMany diff treated the
                // two as different ids, so the existing child was considered
                // orphaned and its foreign key was set to NULL.
                const parentAgain = new Parent()
                parentAgain.id = 1
                const childAgain = new Child()
                childAgain.id = 1
                parentAgain.children = [childAgain]
                await manager.save(parentAgain)

                const reloadedChild = await manager.findOneBy(Child, { id: 1 })
                expect(reloadedChild).to.not.be.null
                // Regression: parentId was NULL here before the fix.
                expect(reloadedChild!.parentId).to.not.be.null
                expect(String(reloadedChild!.parentId)).to.equal("1")
            }),
        ))
})
