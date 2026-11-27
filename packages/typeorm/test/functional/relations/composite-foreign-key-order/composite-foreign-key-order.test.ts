import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"

describe("relations > composite foreign key with joinColumn order different from PK order", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Parent, Child],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create schema and persist when joinColumn order differs from PK order", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parent = new Parent()
                parent.firstId = 1
                parent.secondId = 2
                await dataSource.manager.save(parent)

                const child = new Child()
                child.parent = parent
                await dataSource.manager.save(child)

                const loaded = await dataSource.manager.findOneOrFail(Child, {
                    where: { id: child.id },
                    relations: { parent: true },
                })

                expect(loaded.parent).to.not.be.null
                expect(loaded.parent.firstId).to.equal(1)
                expect(loaded.parent.secondId).to.equal(2)
            }),
        ))
})
