import "reflect-metadata"
import { fileURLToPath, pathToFileURL } from "node:url"
import { describe, expect, it, vi } from "vitest"
import { DataSource } from "../../build/compiled/src/index.js"
import { User } from "./fixtures/User"
import { UserSubscriber } from "./fixtures/UserSubscriber"
import { CreateUsers1700000000000 } from "./fixtures/CreateUsers"

function fixture(pattern) {
    return fileURLToPath(new URL(`./fixtures/${pattern}`, import.meta.url))
}

describe("fileLoader under Vitest", () => {
    it("loads string paths and executes migrations, queries, and subscribers", async () => {
        const fileLoader = vi.fn(
            (filePath) =>
                import(/* @vite-ignore */ pathToFileURL(filePath).href),
        )
        const source = new DataSource({
            type: "sqljs",
            entities: [fixture("User.ts")],
            migrations: [fixture("Create*.ts")],
            subscribers: [fixture("*Subscriber.ts")],
            fileLoader,
        })

        try {
            await source.initialize()
            expect(source.getMetadata(User).target).toBe(User)
            expect(source.migrations[0]).toBeInstanceOf(
                CreateUsers1700000000000,
            )
            expect(source.subscribers[0]).toBeInstanceOf(UserSubscriber)
            expect(fileLoader).toHaveBeenCalledTimes(3)

            await source.runMigrations()
            const repository = source.getRepository(User)
            await repository.save(repository.create({ name: "alice" }))
            const users = await repository.find()
            expect(users).toHaveLength(1)
            expect(users[0]).toBeInstanceOf(User)
            expect(users[0].name).toBe("ALICE")
            expect(source.subscribers[0].inserts).toBe(1)
            await source.undoLastMigration()
            expect(await source.createQueryRunner().hasTable("user")).toBe(
                false,
            )
        } finally {
            if (source.isInitialized) await source.destroy()
        }
    })

    it("does not call the loader for directly supplied classes", async () => {
        const fileLoader = vi.fn()
        const source = new DataSource({
            type: "sqljs",
            entities: [User],
            migrations: [CreateUsers1700000000000],
            subscribers: [UserSubscriber],
            fileLoader,
        })
        try {
            await source.initialize()
            expect(source.getMetadata(User).target).toBe(User)
            expect(fileLoader).not.toHaveBeenCalled()
        } finally {
            if (source.isInitialized) await source.destroy()
        }
    })
})
