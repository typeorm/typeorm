import { expect } from "chai"
import { DataSource } from "../../../../../src"
import "../../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Record } from "./entity/Record"

describe("jsonb type > postgres|cockroachdb", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Record],
                enabledDrivers: ["cockroachdb", "postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should make correct schema with jsonb type", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.synchronize(true)
                const queryRunner = connection.createQueryRunner()
                const schema = await queryRunner.getTable("record")
                await queryRunner.release()
                expect(schema).not.to.be.undefined
                expect(
                    schema!.columns.find(
                        (tableColumn) =>
                            tableColumn.name === "config" &&
                            ["json", "jsonb"].includes(tableColumn.type), // cockroachdb normalizes json type to jsonb
                    ),
                ).to.be.not.empty
                expect(
                    schema!.columns.find(
                        (tableColumn) =>
                            tableColumn.name === "data" &&
                            tableColumn.type === "jsonb",
                    ),
                ).to.be.not.empty
                expect(
                    schema!.columns.find(
                        (tableColumn) =>
                            tableColumn.name === "dataWithDefaultObject" &&
                            tableColumn.type === "jsonb",
                    ),
                ).to.be.not.empty
                expect(
                    schema!.columns.find(
                        (tableColumn) =>
                            tableColumn.name === "dataWithDefaultNull" &&
                            tableColumn.type === "jsonb",
                    ),
                ).to.be.not.empty
            }),
        ))

    it("should persist jsonb correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.synchronize(true)
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = { foo: "bar" }
                const persistedRecord = await recordRepo.save(record)
                const foundRecord = await recordRepo.findOneBy({
                    id: persistedRecord.id,
                })
                expect(foundRecord).to.be.not.undefined
                expect(foundRecord!.data.foo).to.eq("bar")
                expect(foundRecord!.dataWithDefaultNull).to.be.null
                expect(foundRecord!.dataWithDefaultObject).to.eql({
                    hello: "world'O",
                    foo: "bar",
                })
            }),
        ))

    it("should persist jsonb string correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = `foo`
                const persistedRecord = await recordRepo.save(record)
                const foundRecord = await recordRepo.findOneBy({
                    id: persistedRecord.id,
                })
                expect(foundRecord).to.be.not.undefined
                expect(foundRecord!.data).to.be.a("string")
                expect(foundRecord!.data).to.eq("foo")
            }),
        ))

    it("should persist jsonb array correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = [1, `2`, { a: 3 }]
                const persistedRecord = await recordRepo.save(record)
                const foundRecord = await recordRepo.findOneBy({
                    id: persistedRecord.id,
                })
                expect(foundRecord).to.be.not.undefined
                expect(foundRecord!.data).to.deep.include.members([
                    1,
                    "2",
                    { a: 3 },
                ])
            }),
        ))

    it("should create updates when changing object", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.query(
                    `ALTER TABLE record ALTER COLUMN "dataWithDefaultObject" SET DEFAULT '{"foo":"baz","hello": "earth"}';`,
                )

                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).not.to.eql([])
                expect(sqlInMemory.downQueries).not.to.eql([])
            }),
        ))

    it("should not create updates when resorting object", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.query(
                    `ALTER TABLE record ALTER COLUMN "dataWithDefaultObject" SET DEFAULT '{"foo":"bar", "hello": "world''O"}';`,
                )

                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))

    it("should not create new migrations when everything is equivalent", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))

    it("should handle JSONB with quotes correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = { qoute: "He said, O'Brian" }
                const savedRecord = await recordRepo.save(record)

                const foundRecord = await recordRepo.findOneBy({
                    id: savedRecord.id,
                })
                expect(foundRecord).to.be.not.undefined
                expect(foundRecord!).to.deep.include({
                    data: {
                        qoute: "He said, O'Brian",
                    },
                    dataWithDefaultObject: { hello: "world'O", foo: "bar" },
                })
            }),
        ))
})
