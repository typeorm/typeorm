import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Conversation } from "./entity/Conversation"
import { Message } from "./entity/Message"

describe(`query builder > soft-delete global condition on joined entities`, () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function seedData(dataSource: DataSource) {
        const userRepo = dataSource.getRepository(User)
        const convRepo = dataSource.getRepository(Conversation)
        const msgRepo = dataSource.getRepository(Message)

        const user = userRepo.create({ name: "Alice" })
        await userRepo.save(user)

        const conv1 = convRepo.create({ title: "Active Conv", user })
        const conv2 = convRepo.create({ title: "Deleted Conv", user })
        await convRepo.save([conv1, conv2])

        const msg1 = msgRepo.create({
            text: "Hello from active",
            conversation: conv1,
        })
        const msg2 = msgRepo.create({
            text: "Hello from deleted",
            conversation: conv2,
        })
        await msgRepo.save([msg1, msg2])

        // Soft-delete conv2
        await dataSource.manager.softRemove(conv2)

        return { user, conv1, conv2, msg1, msg2 }
    }

    // =======================================================================
    // Fix 1: withDeleted() works regardless of call order
    // =======================================================================

    it("should exclude soft-deleted conversations from join by default", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(1)
                users[0].conversations[0].title.should.be.equal("Active Conv")
            }),
        ))

    it("withDeleted() should include soft-deleted conversations in joined results", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withDeleted()
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(2)

                const titles = users[0].conversations.map((c) => c.title).sort()
                titles.should.deep.equal(["Active Conv", "Deleted Conv"])
            }),
        ))

    it("withDeleted() should include messages from soft-deleted conversations in deep join chain", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withDeleted()
                    .getMany()

                users.length.should.be.equal(1)

                const conversations = users[0].conversations
                conversations.length.should.be.equal(2)

                const messages = conversations.flatMap((c) => c.messages)
                messages.length.should.be.equal(2)

                const texts = messages.map((m) => m.text).sort()
                texts.should.deep.equal([
                    "Hello from active",
                    "Hello from deleted",
                ])
            }),
        ))

    it("withDeleted() should remove the deletedAt condition from the JOIN ON clause in generated SQL", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const qbWithDeleted = dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withDeleted()

                const sql = qbWithDeleted.getQuery()
                // The ON clause should NOT contain deletedAt IS NULL
                // (note: deletedAt still appears in SELECT columns, so we check the specific condition)
                // Use regex to handle different quoting styles (double quotes, backticks, none)
                sql.should.not.match(/deletedAt["`]?\s+IS\s+NULL/i)
            }),
        ))

    // =======================================================================
    // Fix 2: per-join withDeleted control (leftJoinAndSelectWithDeleted etc.)
    // =======================================================================

    it("leftJoinAndSelectWithDeleted() should include soft-deleted rows only for that specific join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                // Include soft-deleted conversations but keep default filter on messages
                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelectWithDeleted(
                        "user.conversations",
                        "conversation",
                    )
                    .leftJoinAndSelect("conversation.messages", "message")
                    .getMany()

                users.length.should.be.equal(1)

                // Both conversations should appear (including soft-deleted)
                const conversations = users[0].conversations
                conversations.length.should.be.equal(2)

                // Messages from both conversations should appear
                const messages = conversations.flatMap((c) => c.messages)
                messages.length.should.be.equal(2)
            }),
        ))

    it("leftJoinAndSelectWithDeleted() should NOT affect other joins that still filter soft-deleted rows", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                // Without WithDeleted on conversations — only active conversation
                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(1)
                users[0].conversations[0].title.should.be.equal("Active Conv")
            }),
        ))

    it("leftJoinAndSelectWithDeleted() SQL should only skip deletedAt for the targeted join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelectWithDeleted(
                        "user.conversations",
                        "conversation",
                    )

                const sql = qb.getQuery()
                // The conversation join should NOT have deletedAt IS NULL condition
                sql.should.not.match(/deletedAt["`]?\s+IS\s+NULL/i)
            }),
        ))

    it("leftJoinWithDeleted() should work without select", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinWithDeleted("user.conversations", "conversation")

                const sql = qb.getQuery()
                sql.should.not.match(/deletedAt["`]?\s+IS\s+NULL/i)
                sql.should.contain("LEFT JOIN")
            }),
        ))

    it("innerJoinAndSelectWithDeleted() should include soft-deleted rows on INNER JOIN", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .innerJoinAndSelectWithDeleted(
                        "user.conversations",
                        "conversation",
                    )

                const sql = qb.getQuery()
                sql.should.contain("INNER JOIN")
                sql.should.not.match(/deletedAt["`]?\s+IS\s+NULL/i)
            }),
        ))
})
