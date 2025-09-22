import { expect } from "chai"
import { DataSource } from "../../../../src"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { JsonEntity } from "./entity/JsonEntity"

describe("mysql json parsing", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [JsonEntity],
                enabledDrivers: ["mysql", "mariadb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly parse JSON objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.jsonObject = { foo: "bar", nested: { value: 123 } }

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.jsonObject).to.deep.equal({
                    foo: "bar",
                    nested: { value: 123 },
                })
            }),
        ))

    it("should correctly parse JSON arrays", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.jsonArray = [1, "two", { three: 3 }, null, true]

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.jsonArray).to.deep.equal([
                    1,
                    "two",
                    { three: 3 },
                    null,
                    true,
                ])
            }),
        ))

    it("should correctly handle JSON string primitives", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.jsonString = "hello world"

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.jsonString).to.be.a("string")
                expect(loaded!.jsonString).to.equal("hello world")
            }),
        ))

    it("should correctly handle JSON number primitives", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.jsonNumber = 42.5

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.jsonNumber).to.be.a("number")
                expect(loaded!.jsonNumber).to.equal(42.5)
            }),
        ))

    it("should correctly handle JSON boolean primitives", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.jsonBoolean = true

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.jsonBoolean).to.be.a("boolean")
                expect(loaded!.jsonBoolean).to.equal(true)
            }),
        ))

    it("should correctly handle JSON null", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.jsonNull = null

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.jsonNull).to.be.null
            }),
        ))

    it("should handle complex nested JSON structures", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.complexJson = {
                    users: [
                        { id: 1, name: "Alice", active: true },
                        { id: 2, name: "Bob", active: false },
                    ],
                    settings: {
                        theme: "dark",
                        notifications: {
                            email: true,
                            push: false,
                        },
                    },
                    metadata: null,
                    count: 42,
                }

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.complexJson).to.deep.equal(entity.complexJson)
            }),
        ))

    it("should handle edge case of JSON strings containing quotes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.jsonString = 'string with "quotes" inside'

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.jsonString).to.be.a("string")
                expect(loaded!.jsonString).to.equal(
                    'string with "quotes" inside',
                )
            }),
        ))

    it("should handle edge case of empty strings", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(JsonEntity)
                const entity = new JsonEntity()
                entity.jsonString = ""

                const saved = await repo.save(entity)
                const loaded = await repo.findOneBy({ id: saved.id })

                expect(loaded).to.be.not.undefined
                expect(loaded!.jsonString).to.be.a("string")
                expect(loaded!.jsonString).to.equal("")
            }),
        ))
})
