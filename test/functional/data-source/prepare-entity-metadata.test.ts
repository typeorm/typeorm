import "reflect-metadata"
import type { EntityMetadata } from "../../../src/metadata/EntityMetadata"

import { setupSingleTestingConnection } from "../../utils/test-utils"
import { PrepareEntityMetadataError } from "../../../src/error"
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

        if (!baseOptions) {
            return
        }

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
        interface EntityMetadataExtend extends EntityMetadata {
            __prepared?: boolean
        }

        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })

        if (!baseOptions) {
            return
        }

        dataSource = new DataSource({
            ...baseOptions,
            prepareEntityMetadata(meta: EntityMetadataExtend) {
                meta.__prepared = true
            },
        })

        await dataSource.initialize()

        for (const meta of dataSource.entityMetadatas) {
            expect((meta as EntityMetadataExtend).__prepared).to.equal(true)
        }
    })

    it("should await async prepareEntityMetadata before continuing", async () => {
        interface EntityMetadataExtend extends EntityMetadata {
            __asyncPrepared?: boolean
        }

        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })

        if (!baseOptions) {
            return
        }

        dataSource = new DataSource({
            ...baseOptions,
            async prepareEntityMetadata(meta: EntityMetadataExtend) {
                await Promise.resolve()
                meta.__asyncPrepared = true
            },
        })

        await dataSource.initialize()
        for (const meta of dataSource.entityMetadatas) {
            expect((meta as EntityMetadataExtend).__asyncPrepared).to.equal(
                true,
            )
        }
    })

    it("should initialize normally when prepareEntityMetadata is not provided", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })

        if (!baseOptions) {
            return
        }

        dataSource = new DataSource(baseOptions)
        await dataSource.initialize()

        expect(dataSource.isInitialized).to.equal(true)
        expect(dataSource.entityMetadatas).to.have.length(1)
    })

    it("should throw PrepareEntityMetadataError when the hook throws synchronously", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })

        if (!baseOptions) {
            return
        }

        dataSource = new DataSource({
            ...baseOptions,
            prepareEntityMetadata() {
                throw new Error("sync failure")
            },
        })

        await expect(dataSource.initialize()).to.be.rejectedWith(
            PrepareEntityMetadataError,
            /sync failure/,
        )
    })

    it("should throw PrepareEntityMetadataError when the hook rejects", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })

        if (!baseOptions) {
            return
        }

        dataSource = new DataSource({
            ...baseOptions,
            async prepareEntityMetadata() {
                await Promise.resolve()
                throw new Error("async failure")
            },
        })

        await expect(dataSource.initialize()).to.be.rejectedWith(
            PrepareEntityMetadataError,
            /async failure/,
        )
    })

    it("should include the entity name in the error message", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post],
        })
        if (!baseOptions) return

        dataSource = new DataSource({
            ...baseOptions,
            prepareEntityMetadata() {
                throw new Error("boom")
            },
        })

        const error = await dataSource.initialize().catch((e) => e)

        expect(error).to.be.instanceOf(PrepareEntityMetadataError)
        expect(error.message).to.include("Post")
        expect(error.message).to.include("boom")
    })

    it("should stop processing further entities after the first failure", async () => {
        const baseOptions = setupSingleTestingConnection("sqljs", {
            entities: [Post, View],
        })
        if (!baseOptions) return

        const processed: string[] = []

        dataSource = new DataSource({
            ...baseOptions,
            prepareEntityMetadata(meta) {
                if (meta.name === "Post") {
                    throw new Error("stop here")
                }
                processed.push(meta.name)
            },
        })

        await expect(dataSource.initialize()).to.be.rejectedWith(
            PrepareEntityMetadataError,
        )

        expect(processed).to.not.include("View")
    })
})
