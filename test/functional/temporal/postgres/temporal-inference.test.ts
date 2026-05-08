import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

let InferredPost: any

describe("temporal > reflect-metadata inference", () => {
    let dataSources: DataSource[] = []
    before(async () => {
        if (typeof (globalThis as any).Temporal === "undefined") return
        const T = (globalThis as any).Temporal

        // Build a target object whose property metadata we can pre-populate
        // BEFORE the @Column decorator runs.
        const target: any = function () {}
        target.prototype = {}
        Reflect.defineMetadata(
            "design:type",
            T.PlainDateTime,
            target.prototype,
            "createdAt",
        )
        Reflect.defineMetadata(
            "design:type",
            T.PlainDate,
            target.prototype,
            "onDate",
        )

        // Now declare the entity. Since the metadata is on
        // target.prototype, we must base the class on that prototype.
        // We achieve this by declaring the class normally and calling
        // Reflect.defineMetadata directly on its prototype just before
        // the decorators run — but the easier way is to define the
        // metadata on a class declared in this scope.
        class _InferredPost {
            id!: number
            createdAt!: any
            onDate!: any
        }
        Reflect.defineMetadata(
            "design:type",
            T.PlainDateTime,
            _InferredPost.prototype,
            "createdAt",
        )
        Reflect.defineMetadata(
            "design:type",
            T.PlainDate,
            _InferredPost.prototype,
            "onDate",
        )
        // Apply decorators manually (in the order TS would).
        PrimaryGeneratedColumn()(_InferredPost.prototype, "id")
        Column()(_InferredPost.prototype, "createdAt")
        Column()(_InferredPost.prototype, "onDate")
        Entity()(_InferredPost as any)
        InferredPost = _InferredPost

        dataSources = await createTestingConnections({
            entities: [InferredPost],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => dataSources.length && reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("infers temporal kind and SQL type from design:type", async function () {
        if (typeof (globalThis as any).Temporal === "undefined") this.skip()
        const T = (globalThis as any).Temporal
        await Promise.all(
            dataSources.map(async (ds) => {
                const repo = ds.getRepository(InferredPost)
                const e: any = new InferredPost()
                e.createdAt = T.PlainDateTime.from("2026-05-07T00:00:00")
                e.onDate = T.PlainDate.from("2026-05-07")
                const saved = await repo.save(e)
                const found: any = await repo.findOneByOrFail({ id: saved.id })
                expect(found.createdAt).to.be.instanceOf(T.PlainDateTime)
                expect(found.onDate).to.be.instanceOf(T.PlainDate)
            }),
        )
    })
})
