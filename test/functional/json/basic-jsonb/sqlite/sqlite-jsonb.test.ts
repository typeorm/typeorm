import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../../utils/test-utils"
import { Record } from "./entity/Record"

// GitHub issue #11930 - TypeORM does not allow jsonb on sqlite
describe("jsonb type > sqlite", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Record],
                enabledDrivers: ["sqljs", "better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))
    it("should make correct schema with Sqlite's jsonb type", () =>
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
                            tableColumn.type === "json",
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

    it("should correctly save and retrieve JSONB data", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = { key: "value", nested: { num: 42 } }

                const persistedRecord = await recordRepo.save(record)
                const foundRecord = await recordRepo.findOneBy({
                    id: persistedRecord.id,
                })
                expect(foundRecord).to.be.not.undefined
                expect(foundRecord!.data).to.deep.equal({
                    key: "value",
                    nested: { num: 42 },
                })
            }),
        ))
    it("should create updates when changing object", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const schemaBefore = await queryRunner.getTable("record")
                const column = schemaBefore?.findColumnByName(
                    "dataWithDefaultObject",
                )
                const oldColumn = column?.clone()
                column!.default = `jsonb('{"foo":"baz","hello": "earth"}')`
                await queryRunner.changeColumn("record", oldColumn!, column!)
                await queryRunner.release()

                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.not.eql([])
                expect(sqlInMemory.downQueries).to.not.eql([])
            }),
        ))
    it("should not create updates when resorting object", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const schemaBefore = await queryRunner.getTable("record")
                const column = schemaBefore?.findColumnByName(
                    "dataWithDefaultObject",
                )
                const oldColumn = column?.clone()
                column!.default = `jsonb('{"foo": "bar", "hello":"world''O"}')`
                await queryRunner.changeColumn("record", oldColumn!, column!)
                await queryRunner.release()

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
    it("should correctly save and retrieve JSONB array data", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = [1, "two", { three: 3 }]

                const persistedRecord = await recordRepo.save(record)
                const foundRecord = await recordRepo.findOneBy({
                    id: persistedRecord.id,
                })
                expect(foundRecord).to.be.not.undefined
                expect(foundRecord!.data).to.deep.equal([
                    1,
                    "two",
                    { three: 3 },
                ])
            }),
        ))
    it("should bulk insert and retrieve JSONB data correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const records: Record[] = []

                for (let i = 0; i < 5; i++) {
                    const record = new Record()
                    record.data = { index: i, valid: i % 2 === 0 }
                    records.push(record)
                }

                await recordRepo.save(records)

                const savedRecords = await recordRepo.find()
                expect(savedRecords.length).to.equal(5)
                for (let i = 0; i < 5; i++) {
                    expect(savedRecords[i].data).to.deep.equal({
                        index: i,
                        valid: i % 2 === 0,
                    })
                }
            }),
        ))
    it("should update JSONB data correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = { initial: true }
                const persistedRecord = await recordRepo.save(record)

                persistedRecord.data = { updated: true, count: 1 }
                await recordRepo.save(persistedRecord)

                const foundRecord = await recordRepo.findOneBy({
                    id: persistedRecord.id,
                })
                expect(foundRecord).to.be.not.undefined
                expect(foundRecord!.data).to.deep.equal({
                    updated: true,
                    count: 1,
                })
            }),
        ))
    it("should upsert JSONB data correctly with orUpdate", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = { upsert: 1 }
                await recordRepo
                    .createQueryBuilder()
                    .insert()
                    .into(Record)
                    .values(record)
                    .execute()

                const records = await recordRepo.find()
                expect(records).to.have.lengthOf(1)
                expect(records[0].data).to.deep.equal({ upsert: 1 })

                // Now perform an upsert to update the existing record
                record.data = { upsert: 2 }
                await recordRepo
                    .createQueryBuilder()
                    .insert()
                    .into(Record)
                    .values(record)
                    .orUpdate(["data"], ["id"])
                    .execute()

                const updatedRecords = await recordRepo.find()
                expect(updatedRecords).to.have.lengthOf(1)
                expect(updatedRecords[0].data).to.deep.equal({ upsert: 2 })
            }),
        ))
    it("should query JSONB data correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const recordRepo = connection.getRepository(Record)
                const record = new Record()
                record.data = { search: "me" }
                await recordRepo.save(record)

                const foundRecords = await recordRepo
                    .createQueryBuilder("record")
                    .where("record.data ->> 'search' = :value", { value: "me" })
                    .getMany()

                expect(foundRecords).to.have.lengthOf(1)
                expect(foundRecords[0].data).to.deep.equal({ search: "me" })
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
