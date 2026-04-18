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

describe("persistence > orphanage > nullify > nullable-fk", () => {
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

    async function seedParent(dataSource: DataSource) {
        const parentRepo = dataSource.getRepository(Parent)
        const parent = new Parent("test")
        parent.children = [
            Object.assign(new Child(), { name: "child1" }),
            Object.assign(new Child(), { name: "child2" }),
        ]
        await parentRepo.save(parent)
        return parent
    }

    it("should not touch children when relation is not loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = await seedParent(dataSource)

                const loaded = await parentRepo.findOneByOrFail({
                    id: parent.id,
                })
                expect(loaded.children).to.be.undefined
                loaded.name = "updated"
                await parentRepo.save(loaded)

                const children = await childRepo.find()
                expect(children).to.have.lengthOf(2)
                expect(children.every((c) => c.parentId === parent.id)).to.be
                    .true
            }),
        ))

    it("should not touch children when relation is loaded but not modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = await seedParent(dataSource)

                const loaded = await parentRepo.findOneOrFail({
                    where: { id: parent.id },
                    relations: { children: true },
                })
                expect(loaded.children).to.have.lengthOf(2)
                loaded.name = "updated"
                await parentRepo.save(loaded)

                const children = await childRepo.find()
                expect(children).to.have.lengthOf(2)
                expect(children.every((c) => c.parentId === parent.id)).to.be
                    .true
            }),
        ))

    it("should nullify FK on orphaned children when relation is loaded and modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = await seedParent(dataSource)

                const loaded = await parentRepo.findOneOrFail({
                    where: { id: parent.id },
                    relations: { children: true },
                })
                loaded.children = loaded.children.filter(
                    (c) => c.name === "child1",
                )
                await parentRepo.save(loaded)

                const children = await childRepo.find()
                expect(children).to.have.lengthOf(2)

                const orphan = children.find((c) => c.name === "child2")
                expect(orphan).to.not.be.undefined
                expect(orphan?.parentId).to.be.null

                const retained = children.find((c) => c.name === "child1")
                expect(retained).to.not.be.undefined
                expect(retained?.parentId).to.equal(parent.id)
            }),
        ))
})
