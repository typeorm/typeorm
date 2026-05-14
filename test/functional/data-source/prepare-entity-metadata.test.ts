import "reflect-metadata"
import type { EntityMetadata } from "../../../src/metadata/EntityMetadata"

import { setupSingleTestingConnection } from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { View } from "./entity/View"

describe("DataSource > prepareEntityMetadata", () => {
    let dataSource: DataSource

    afterEach(async () => {
        if (dataSource?.isInitialized) {
            await dataSource.destroy()
        }
    })

    it("should call prepareEntityMetadata once per entity metadata", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post, View],
        })
        if (!baseOptions) return

        const collectedMetas: EntityMetadata[] = []

        dataSource = new DataSource({
            ...baseOptions,
            prepareEntityMetadata(meta) {
                collectedMetas.push(meta)
            },
        })

        await dataSource.initialize()

        expect(collectedMetas).to.have.length(dataSource.entityMetadatas.length)
        expect(collectedMetas.map((m) => m.target)).to.have.members(
            dataSource.entityMetadatas.map((m) => m.target),
        )
    })

    it("should make mutations visible in the final entity metadata", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })
        if (!baseOptions) return

        dataSource = new DataSource({
            ...baseOptions,
            prepareEntityMetadata(meta) {
                ;(meta as any).__prepared = true
            },
        })

        await dataSource.initialize()

        for (const meta of dataSource.entityMetadatas) {
            expect((meta as any).__prepared).to.equal(true)
        }
    })

    it("should await async prepareEntityMetadata before continuing", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })
        if (!baseOptions) return

        dataSource = new DataSource({
            ...baseOptions,
            async prepareEntityMetadata(meta) {
                await Promise.resolve()
                ;(meta as any).__asyncPrepared = true
            },
        })

        await dataSource.initialize()

        for (const meta of dataSource.entityMetadatas) {
            expect((meta as any).__asyncPrepared).to.equal(true)
        }
    })

    it("should initialize normally when prepareEntityMetadata is not provided", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })
        if (!baseOptions) return

        dataSource = new DataSource(baseOptions)
        await dataSource.initialize()

        expect(dataSource.isInitialized).to.equal(true)
        expect(dataSource.entityMetadatas).to.have.length(1)
    })
})
