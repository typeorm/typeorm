import { expect } from "chai"
import type { DataSource } from "../../../../src"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Record } from "./entity/Record"

describe("jsonb type", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Record],
            enabledDrivers: ["postgres"], // because only postgres supports jsonb type
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should make correct schema with Postgres' jsonb type", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.synchronize(true)
                const queryRunner = dataSource.createQueryRunner()
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

    it("should persist jsonb correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.synchronize(true)
                const recordRepo = dataSource.getRepository(Record)
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
                    hello: "world",
                    foo: "bar",
                })
            }),
        ))

    it("should persist jsonb string correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const recordRepo = dataSource.getRepository(Record)
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
            dataSources.map(async (dataSource) => {
                const recordRepo = dataSource.getRepository(Record)
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
            dataSources.map(async (dataSource) => {
                await dataSource.query(
                    `ALTER TABLE record ALTER COLUMN "dataWithDefaultObject" SET DEFAULT '{"foo":"baz","hello": "earth"}';`,
                )

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).not.to.eql([])
                expect(sqlInMemory.downQueries).not.to.eql([])
            }),
        ))

    it("should not create updates when resorting object", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.query(
                    `ALTER TABLE record ALTER COLUMN "dataWithDefaultObject" SET DEFAULT '{"foo":"bar", "hello": "world"}';`,
                )

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))

    it("should persist json and jsonb arrays of complex objects correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const recordRepo = dataSource.getRepository(Record)
                const record = new Record()
                record.data = [
                    {
                        data1: "hello1",
                        data2: "hello2",
                        isActive: true,
                    },
                    {
                        data1: "hi1",
                        data2: "hi2",
                        isActive: false,
                    },
                ]
                record.config = [
                    {
                        id: 1,
                        option1: "1",
                        isActive: true,
                        extra: { data1: "one", data2: "two" },
                    },
                    {
                        id: 2,
                        option1: "2",
                        isActive: false,
                        extra: { data1: "one", data2: "two" },
                    },
                ]
                const persistedRecord = await recordRepo.save(record)
                const foundRecord = await recordRepo.findOneBy({
                    id: persistedRecord.id,
                })
                expect(foundRecord).to.be.not.undefined
                expect(foundRecord!.data).to.eql(record.data)
                expect(foundRecord!.config).to.eql(record.config)
            }),
        ))

    it("should not create new migrations when everything is equivalent", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))
})
