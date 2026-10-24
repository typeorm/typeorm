import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Tag } from "./entity/Tag"

describe("github issues > #12994 insert().orIgnore() writes returned rows onto the wrong entities when a row is skipped", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Tag],
            // drivers that emit "ON CONFLICT ... DO NOTHING" and read generated
            // values back through RETURNING
            enabledDrivers: ["postgres", "cockroachdb", "better-sqlite3"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("gives each inserted entity its own row and leaves the skipped one alone", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Tag)

                // "a" already exists, so it is skipped on the insert below
                await repository.insert({ name: "a" })
                const existingA = await repository.findOneByOrFail({
                    name: "a",
                })

                const tags = [
                    repository.create({ name: "a" }),
                    repository.create({ name: "b" }),
                ]
                await repository
                    .createQueryBuilder()
                    .insert()
                    .values(tags)
                    .orIgnore()
                    .execute()

                const [tagA, tagB] = tags
                const dbB = await repository.findOneByOrFail({ name: "b" })

                // the inserted entity gets its own generated id
                expect(tagB.id).to.be.a("string")
                expect(tagB.id).to.equal(dbB.id)

                // the skipped entity never receives the inserted row's id
                expect(tagA.id).to.not.equal(tagB.id)

                // and it is not silently turned into the pre-existing row either
                expect(tagA.id).to.not.equal(existingA.id)

                // the pre-existing row is untouched, nothing new was created for "a"
                expect(await repository.countBy({ name: "a" })).to.equal(1)
                expect(
                    (await repository.findOneByOrFail({ name: "a" })).id,
                ).to.equal(existingA.id)
            }),
        ))

    it("maps rows correctly when the skipped entity is not the first one", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Tag)

                await repository.insert({ name: "q" })

                const tags = [
                    repository.create({ name: "p" }),
                    repository.create({ name: "q" }), // skipped (middle)
                    repository.create({ name: "r" }),
                ]
                await repository
                    .createQueryBuilder()
                    .insert()
                    .values(tags)
                    .orIgnore()
                    .execute()

                const [tagP, tagQ, tagR] = tags
                const dbP = await repository.findOneByOrFail({ name: "p" })
                const dbR = await repository.findOneByOrFail({ name: "r" })

                expect(tagP.id).to.equal(dbP.id)
                expect(tagR.id).to.equal(dbR.id)

                // the skipped middle entity did not steal an inserted row's id
                expect(tagQ.id).to.not.equal(tagP.id)
                expect(tagQ.id).to.not.equal(tagR.id)

                // all three inserted/attempted entities stay distinct
                expect(new Set([tagP.id, tagQ.id, tagR.id]).size).to.equal(3)
            }),
        ))

    it("keeps positional mapping when no row is skipped", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Tag)

                const tags = [
                    repository.create({ name: "x" }),
                    repository.create({ name: "y" }),
                ]
                await repository
                    .createQueryBuilder()
                    .insert()
                    .values(tags)
                    .orIgnore()
                    .execute()

                const [tagX, tagY] = tags
                const dbX = await repository.findOneByOrFail({ name: "x" })
                const dbY = await repository.findOneByOrFail({ name: "y" })

                expect(tagX.id).to.equal(dbX.id)
                expect(tagY.id).to.equal(dbY.id)
                expect(tagX.id).to.not.equal(tagY.id)
            }),
        ))
})
