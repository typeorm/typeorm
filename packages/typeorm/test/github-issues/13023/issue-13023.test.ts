import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Setting } from "./entity/Setting"

describe("github issues > #13023 multi-row upsert returns wrong generated ids on drivers without RETURNING", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Setting],
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

    async function getId(
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
                    { id: await getId(dataSource, "a") },
                    { id: await getId(dataSource, "e") },
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
                    { id: await getId(dataSource, "e") },
                    { id: await getId(dataSource, "a") },
                ])
                expect(await repository.count()).to.equal(2)
            }),
        ))

    it("should return the id of a row matched through a case-insensitive collation", () =>
        Promise.all(
            dataSources
                .filter((dataSource) =>
                    ["mysql", "mariadb", "aurora-mysql"].includes(
                        dataSource.driver.options.type,
                    ),
                )
                .map(async (dataSource) => {
                    const repository = dataSource.getRepository(Setting)
                    await repository.insert({
                        key1: "x",
                        key2: "x",
                        value: "0",
                    })
                    await repository.insert({
                        key1: "a",
                        key2: "b",
                        value: "c",
                    })

                    const result = await repository.upsert(
                        [
                            { key1: "A", key2: "B", value: "d" },
                            { key1: "e", key2: "f", value: "g" },
                        ],
                        ["key1", "key2"],
                    )

                    expect(result.identifiers).to.deep.equal([
                        { id: await getId(dataSource, "a") },
                        { id: await getId(dataSource, "e") },
                    ])
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
                    { id: await getId(dataSource, "a") },
                    { id: await getId(dataSource, "e") },
                ])
            }),
        ))
})
