import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src"
import { expect } from "chai"
import { Category } from "./entity/Category"

describe("relations > self-referencing query", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            relationLoadStrategy: "query",
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load self-referencing parent relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const parent = new Category()
                await manager.save(parent)

                const child = new Category()
                child.parent = parent
                await manager.save(child)

                const loaded = await manager.findOne(Category, {
                    where: { id: child.id },
                    relations: { parent: true },
                })

                expect(loaded).to.not.be.null
                expect(loaded?.parent).to.not.be.null
                expect(loaded?.parent?.id).to.equal(parent.id)
            }),
        ))

    it("should load three levels of self-referencing relations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const grandparent = new Category()
                await manager.save(grandparent)

                const parent = new Category()
                parent.parent = grandparent
                await manager.save(parent)

                const child = new Category()
                child.parent = parent
                await manager.save(child)

                const loadedChild = await manager.findOne(Category, {
                    where: { id: child.id },
                    relations: { parent: { parent: true } },
                })

                expect(loadedChild).to.not.be.null
                expect(loadedChild?.parent).to.not.be.null
                expect(loadedChild?.parent?.id).to.equal(parent.id)
                expect(loadedChild?.parent?.parent).to.not.be.null
                expect(loadedChild?.parent?.parent?.id).to.equal(grandparent.id)
            }),
        ))
})
