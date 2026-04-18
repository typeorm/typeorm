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

describe("persistence > orphanage > nullify > non-nullable-fk", () => {
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
            Object.assign(new Child(), { name: "keep" }),
            Object.assign(new Child(), { name: "orphan" }),
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

                expect(await childRepo.count()).to.equal(2)
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

                expect(await childRepo.count()).to.equal(2)
            }),
        ))

    it("should delete orphaned children when relation is loaded and modified (FK is not nullable)", () =>
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
                    (c) => c.name === "keep",
                )
                await parentRepo.save(loaded)

                // Orphaned child should be deleted (not nullified) since FK is NOT NULL
                const remaining = await childRepo.find()
                expect(remaining).to.have.lengthOf(1)
                expect(remaining[0].name).to.equal("keep")
            }),
        ))
})
