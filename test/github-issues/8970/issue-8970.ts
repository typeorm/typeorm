import "reflect-metadata"

import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { DatabaseType, DataSource } from "../../../src"
import { TestEntity } from "./entities/TestEntity"
import { expect } from "chai"

describe("query builder order nulls first/last", async () => {
    let dataSources: DataSource[]
    const enabledDrivers: DatabaseType[] = [
        "postgres",
        "sqlite",
        "better-sqlite3",
    ]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entities/*{.js,.ts}"],
            enabledDrivers,
            schemaCreate: true,
            dropSchema: false,
        })

        for (const dataSource of dataSources) {
            const repository = dataSource.getRepository(TestEntity)

            for (let i = 0; i < 5; i++) {
                const entity = new TestEntity()
                entity.testColumn = ""

                await repository.save(entity)
            }

            for (let i = 0; i < 5; i++) {
                const entity = new TestEntity()

                await repository.save(entity)
            }
        }
    })

    after(async () => {
        for (const dataSource of dataSources) {
            await dataSource.dropDatabase()
        }

        await closeTestingConnections(dataSources)
    })

    const runTest = async (
        dataSource: DataSource | undefined,
        firstOrLastString: "first" | "FIRST" | "last" | "LAST",
    ) => {
        if (!dataSource) return

        const repository = dataSource.getRepository(TestEntity)
        const testArray = await repository.find({
            order: {
                testColumn: { direction: "DESC", nulls: firstOrLastString },
            },
        })
        const test =
            ["first", "FIRST"].indexOf(firstOrLastString) !== -1
                ? testArray.shift()
                : testArray.pop()

        expect(test?.testColumn).to.be.null
    }

    for (const enabledDriver of enabledDrivers) {
        it(`first should work with lowercase (${enabledDriver})`, async () => {
            const dataSource = dataSources.find(
                (dataSource) => dataSource.options.type === enabledDriver,
            )
            expect(dataSource).to.exist
            await runTest(dataSource, "first")
        })

        it(`FIRST should work with uppercase (${enabledDriver})`, async () => {
            const dataSource = dataSources.find(
                (dataSource) => dataSource.options.type === enabledDriver,
            )
            expect(dataSource).to.exist
            await runTest(dataSource, "FIRST")
        })

        it(`last should work with lowercase (${enabledDriver})`, async () => {
            const dataSource = dataSources.find(
                (dataSource) => dataSource.options.type === enabledDriver,
            )
            expect(dataSource).to.exist
            await runTest(dataSource, "last")
        })

        it(`LAST should work with uppercase (${enabledDriver})`, async () => {
            const dataSource = dataSources.find(
                (dataSource) => dataSource.options.type === enabledDriver,
            )
            expect(dataSource).to.exist
            await runTest(dataSource, "LAST")
        })
    }
})
