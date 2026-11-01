import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"
import { Account } from "./entity/Account"
import { Order } from "./entity/Order"

describe("github issues > #12094 upsert must not mutate input entities", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [User, Account, Order],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => {
        Account.observedIds = []
        return reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("should not mutate the input object when upsert inserts a new row", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(User)

                const input = { name: "Alice", email: "alice@example.com" }

                await repository.upsert(input, ["email"])

                // the input object must be left untouched: no generated id written back
                expect(input).to.deep.equal({
                    name: "Alice",
                    email: "alice@example.com",
                })
            }),
        ))

    it("should not overwrite the input object's id when upsert updates an existing row", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(User)

                // seed a row and capture its real id
                const seeded = await repository.save({
                    name: "Bob",
                    email: "bob@example.com",
                })
                const realId = seeded.id

                // upsert on the unique "email" key -> this is an UPDATE, not an insert.
                // The input carries no id; it must still carry no id afterwards,
                // instead of being overwritten with a fabricated/wrong value.
                const input = { name: "Bob Updated", email: "bob@example.com" }

                await repository.upsert(input, ["email"])

                expect(input).to.not.have.property("id")

                // the row itself was updated correctly and kept its original id
                const stored = await repository.findOneByOrFail({
                    email: "bob@example.com",
                })
                expect(stored.id).to.equal(realId)
                expect(stored.name).to.equal("Bob Updated")
            }),
        ))

    it("should still expose generated ids through the InsertResult", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(User)

                const input = { name: "Carol", email: "carol@example.com" }

                const result = await repository.upsert(input, ["email"])

                // the return value remains the channel for generated values
                expect(result.identifiers).to.have.length(1)
                expect(result.identifiers[0].id).to.be.a("number")
            }),
        ))

    it("should still expose the generated id to after-insert listeners without mutating the input", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Account)

                // an actual entity instance, so the @AfterInsert listener fires
                const input = Object.assign(new Account(), {
                    email: "dave@example.com",
                })

                await repository.upsert(input, ["email"])

                // the input object is left untouched...
                expect(input.id).to.be.undefined
                // ...but the after-insert listener still saw the generated id
                const lastObserved = Account.observedIds.at(-1)
                expect(lastObserved).to.be.a("number")
            }),
        ))

    it("should not mutate embedded objects of the input during upsert", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Order)

                const input: any = { reference: "ref-1", meta: {} }

                await repository.upsert(input, ["reference"])

                // the embedded "meta" object must stay exactly as passed in,
                // the re-selected default must not leak back into it
                expect(input.meta).to.deep.equal({})
            }),
        ))
})
