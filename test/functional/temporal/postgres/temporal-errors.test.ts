import "reflect-metadata"
import { expect } from "chai"
import {
    DataSource,
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "../../../../src"

describe("temporal > error paths", () => {
    it("fails fast when globalThis.Temporal is missing", async function () {
        const original = (globalThis as any).Temporal
        if (typeof original === "undefined") this.skip()
        ;(globalThis as any).Temporal = undefined

        @Entity()
        class E {
            @PrimaryGeneratedColumn() id!: number
            @Column({ type: "timestamptz", temporal: true } as any) at!: any
        }

        const ds = new DataSource({
            type: "postgres",
            entities: [E],
            host: "localhost",
        } as any)
        try {
            await ds.initialize()
            expect.fail("should have rejected")
        } catch (err: any) {
            expect(err.message).to.match(/Temporal.*not.*available/i)
        } finally {
            ;(globalThis as any).Temporal = original
            if (ds.isInitialized) await ds.destroy()
        }
    })
})
