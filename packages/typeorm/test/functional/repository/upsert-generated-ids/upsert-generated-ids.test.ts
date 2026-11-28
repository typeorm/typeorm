import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { BigSetting } from "./entity/BigSetting"
import { BinarySetting } from "./entity/BinarySetting"
import { DatedEvent } from "./entity/DatedEvent"
import { Setting } from "./entity/Setting"

// https://github.com/typeorm/typeorm/issues/13023
describe("repository > upsert > generated ids on drivers without RETURNING", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Setting, DatedEvent],
            enabledDrivers: [
                "mysql",
                "mariadb",
                "aurora-mysql",
                "better-sqlite3",
                "sqljs",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const isMySQLFamily = (dataSource: DataSource) =>
        ["mysql", "mariadb", "aurora-mysql"].includes(
            dataSource.driver.options.type,
        )

    async function getSettingId(
        dataSource: DataSource,
        key1: string,
    ): Promise<number> {
        const row = await dataSource
            .getRepository(Setting)
            .findOneByOrFail({ key1 })
        return row.id
    }

    it("should return the ids of updated and inserted rows when a batch mixes both", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Setting)
                await repository.insert({ key1: "x", key2: "x", value: "0" })
                await repository.insert({ key1: "a", key2: "b", value: "c" })

                const result = await repository.upsert(
                    [
                        { key1: "a", key2: "b", value: "d" },
                        { key1: "e", key2: "f", value: "g" },
                    ],
                    ["key1", "key2"],
                )

                expect(result.identifiers).to.deep.equal([
                    { id: await getSettingId(dataSource, "a") },
                    { id: await getSettingId(dataSource, "e") },
                ])
            }),
        ))

    it("should return the ids of existing rows when every row in the batch is updated", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Setting)
                await repository.insert([
                    { key1: "a", key2: "b", value: "c" },
                    { key1: "e", key2: "f", value: "g" },
                ])

                const result = await repository.upsert(
                    [
                        { key1: "e", key2: "f", value: "h" },
                        { key1: "a", key2: "b", value: "d" },
                    ],
                    ["key1", "key2"],
                )

                expect(result.identifiers).to.deep.equal([
                    { id: await getSettingId(dataSource, "e") },
                    { id: await getSettingId(dataSource, "a") },
                ])
                expect(await repository.count()).to.equal(2)
            }),
        ))

    it("should return the ids of new rows when every row in the batch is inserted", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Setting)

                const result = await repository.upsert(
                    [
                        { key1: "a", key2: "b", value: "c" },
                        { key1: "e", key2: "f", value: "g" },
                    ],
                    ["key1", "key2"],
                )

                expect(result.identifiers).to.deep.equal([
                    { id: await getSettingId(dataSource, "a") },
                    { id: await getSettingId(dataSource, "e") },
                ])
            }),
        ))

    it("should return the id of a row matched through a case- and accent-insensitive collation", () =>
        Promise.all(
            dataSources.filter(isMySQLFamily).map(async (dataSource) => {
                const repository = dataSource.getRepository(Setting)
                await repository.insert({ key1: "x", key2: "x", value: "0" })
                await repository.insert({ key1: "cafe", key2: "b", value: "c" })

                // only `value` is overwritten, so the stored key keeps its original spelling
                const result = await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Setting)
                    .values([
                        { key1: "CAFÉ", key2: "B", value: "d" },
                        { key1: "e", key2: "f", value: "g" },
                    ])
                    .orUpdate(["value"], ["key1", "key2"])
                    .execute()

                expect(result.identifiers).to.deep.equal([
                    { id: await getSettingId(dataSource, "cafe") },
                    { id: await getSettingId(dataSource, "e") },
                ])
            }),
        ))

    it("should return the ids of rows upserted by a date key given as Date objects", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(DatedEvent)
                await repository.insert({
                    day: new Date("2026-01-01T00:00:00"),
                    label: "x",
                })
                await repository.insert({
                    day: new Date("2026-01-02T00:00:00"),
                    label: "a",
                })

                const result = await repository.upsert(
                    [
                        { day: new Date("2026-01-02T00:00:00"), label: "b" },
                        { day: new Date("2026-01-03T00:00:00"), label: "c" },
                    ],
                    ["day"],
                )

                const idOf = async (label: string) =>
                    (await repository.findOneByOrFail({ label })).id
                expect(result.identifiers).to.deep.equal([
                    { id: await idOf("b") },
                    { id: await idOf("c") },
                ])
            }),
        ))
})

describe("repository > upsert > generated bigint ids on drivers without RETURNING", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [BigSetting, BinarySetting],
            enabledDrivers: ["mysql", "mariadb", "aurora-mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return the ids of rows with bigint primary keys", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(BigSetting)
                await repository.insert({ key: "x", value: "0" })
                await repository.insert({ key: "a", value: "c" })

                const result = await repository.upsert(
                    [
                        { key: "a", value: "d" },
                        { key: "e", value: "g" },
                    ],
                    ["key"],
                )

                const idOf = async (key: string) =>
                    String((await repository.findOneByOrFail({ key })).id)
                expect(
                    result.identifiers.map((identifier) =>
                        String(identifier.id),
                    ),
                ).to.deep.equal([await idOf("a"), await idOf("e")])
            }),
        ))

    it("should still merge database defaults into a plain multi-row insert with bigint primary keys", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const result = await dataSource
                    .getRepository(BigSetting)
                    .insert([{ key: "a" }, { key: "b" }])

                expect(
                    result.generatedMaps.map((generated) => generated.value),
                ).to.deep.equal(["default", "default"])
            }),
        ))

    it("should return distinct ids for binary keys that stringify identically", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(BinarySetting)
                await repository.insert({
                    key: Buffer.from([0x00]),
                    value: "x",
                })
                await repository.insert({
                    key: Buffer.from([0xff]),
                    value: "a",
                })

                const result = await repository.upsert(
                    [
                        { key: Buffer.from([0xff]), value: "b" },
                        { key: Buffer.from([0xfe]), value: "c" },
                    ],
                    ["key"],
                )

                const idOf = async (value: string) =>
                    (await repository.findOneByOrFail({ value })).id
                expect(result.identifiers).to.deep.equal([
                    { id: await idOf("b") },
                    { id: await idOf("c") },
                ])
            }),
        ))
})
