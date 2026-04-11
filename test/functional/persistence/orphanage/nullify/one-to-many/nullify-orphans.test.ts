import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"

describe("persistence > orphanage > nullify > one-to-many", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should nullify FK on orphaned entity when FK is nullable", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = new Parent("test")
                parent.children = [
                    Object.assign(new Child(), { name: "child1" }),
                    Object.assign(new Child(), { name: "child2" }),
                ]
                await parentRepo.save(parent)

                expect(await childRepo.count()).to.equal(2)

                const loaded = await parentRepo.findOneByOrFail({
                    id: parent.id,
                })
                loaded.children = loaded.children.filter(
                    (c) => c.name === "child1",
                )
                await parentRepo.save(loaded)

                // Both children should still exist
                const children = await childRepo.find()
                expect(children).to.have.lengthOf(2)

                // The orphaned child should have null FK
                const orphan = children.find((c) => c.name === "child2")
                expect(orphan).to.not.be.undefined
                expect(orphan?.parentId).to.be.null

                // The retained child should still have the FK
                const retained = children.find((c) => c.name === "child1")
                expect(retained).to.not.be.undefined
                expect(retained?.parentId).to.equal(parent.id)
            }),
        ))
})
