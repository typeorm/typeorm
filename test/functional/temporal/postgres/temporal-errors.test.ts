import "reflect-metadata"
import { expect } from "chai"
import {
    DataSource,
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "../../../../src"

const temporalHost = globalThis as { Temporal?: unknown }

describe("temporal > error paths", () => {
    it("fails fast when globalThis.Temporal is missing", async function () {
        const original = temporalHost.Temporal
        if (typeof original === "undefined") this.skip()
        temporalHost.Temporal = undefined

        @Entity()
        class E {
            @PrimaryGeneratedColumn() id!: number
            @Column({ type: "timestamptz", temporal: true })
            at!: unknown
        }

        const ds = new DataSource({
            type: "postgres",
            entities: [E],
            host: "localhost",
        })
        try {
            await ds.initialize()
            expect.fail("should have rejected")
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            expect(message).to.match(/Temporal.*not.*available/i)
        } finally {
            temporalHost.Temporal = original
            if (ds.isInitialized) await ds.destroy()
        }
    })
})
