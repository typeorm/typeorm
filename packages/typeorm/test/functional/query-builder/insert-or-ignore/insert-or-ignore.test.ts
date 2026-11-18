import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Item } from "./entity/Item"
import { Tag } from "./entity/Tag"

describe("query builder > insert > or ignore", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Item, Tag],
            // the sqlite drivers do not return the inserted rows, so the
            // values written back after an insert that skipped rows cannot
            // be attributed to their entities positionally
            enabledDrivers: ["better-sqlite3"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not write generated ids of other rows onto entities skipped by orIgnore", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Item)
                await repository.insert({ name: "dup" })

                const items: { id?: number; name: string }[] = [
                    { name: "dup" },
                    { name: "fresh" },
                ]
                const result = await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Item)
                    .values(items)
                    .orIgnore()
                    .execute()

                // the first entity was skipped: it must be left without an id
                // instead of receiving the id of another (or of no) row
                expect(items[0].id).to.equal(undefined)
                expect(result.identifiers[0]).to.equal(undefined)
                expect(result.generatedMaps[0].id).to.equal(undefined)

                // rows cannot be attributed when some were skipped, so the
                // inserted entity must not receive a positional id either
                expect(items[1].id).to.equal(undefined)
                expect(result.identifiers[1]).to.equal(undefined)
                expect(result.generatedMaps[1].id).to.equal(undefined)

                // while the database itself has every non-conflicting row
                const loaded = await repository.find({ order: { id: "ASC" } })
                expect(loaded.map((item) => item.name)).to.have.members([
                    "dup",
                    "fresh",
                ])
                expect(loaded).to.have.lengthOf(2)
            }),
        ))

    it("should not write a client-generated uuid onto an entity skipped by orIgnore", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Tag)
                await repository.insert({ name: "dup" })

                const tags: { id?: string; name: string }[] = [
                    { name: "dup" },
                    { name: "fresh" },
                ]
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Tag)
                    .values(tags)
                    .orIgnore()
                    .execute()

                expect(tags[0].id).to.equal(undefined)

                const loaded = await repository.find()
                expect(loaded.map((tag) => tag.name)).to.have.members([
                    "dup",
                    "fresh",
                ])
                expect(loaded).to.have.lengthOf(2)
            }),
        ))
})
