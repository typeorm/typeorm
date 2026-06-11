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
    // Default behavior: soft-deleted rows are excluded from joins
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

    // =======================================================================
    // Global withDeleted(): called BEFORE any join
    // =======================================================================

    it("withDeleted() before joins should include soft-deleted rows in ALL joins (global)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .withDeleted()
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(2)

                const titles = users[0].conversations.map((c) => c.title).sort()
                titles.should.deep.equal(["Active Conv", "Deleted Conv"])
            }),
        ))

    it("global withDeleted() should include messages from soft-deleted conversations in deep join chain", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .withDeleted()
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
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

    it("global withDeleted() should remove the deletedAt condition from ALL JOIN ON clauses in generated SQL", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const qbWithDeleted = dataSource
                    .createQueryBuilder(User, "user")
                    .withDeleted()
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")

                const sql = qbWithDeleted.getQuery()
                sql.should.not.match(/deletedAt["`]?\s+IS\s+NULL/i)
            }),
        ))

    // =======================================================================
    // Per-join withDeleted(): chained AFTER a specific join
    // =======================================================================

    it("withDeleted() chained after leftJoinAndSelect should include soft-deleted rows only for that specific join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                // Include soft-deleted conversations but keep default filter on messages
                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withDeleted()
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

    it("withDeleted() should NOT affect joins that were added before it", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                // Without withDeleted on conversations — only active conversation
                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(1)
                users[0].conversations[0].title.should.be.equal("Active Conv")
            }),
        ))

    it("withDeleted() chained after leftJoinAndSelect SQL should only skip deletedAt for the targeted join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withDeleted()

                const sql = qb.getQuery()
                // The conversation join should NOT have deletedAt IS NULL condition
                sql.should.not.match(/deletedAt["`]?\s+IS\s+NULL/i)
            }),
        ))

    it("withDeleted() chained after leftJoin should work without select", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoin("user.conversations", "conversation")
                    .withDeleted()

                const sql = qb.getQuery()
                sql.should.not.match(/deletedAt["`]?\s+IS\s+NULL/i)
                sql.should.contain("LEFT JOIN")
            }),
        ))

    it("withDeleted() chained after innerJoinAndSelect should include soft-deleted rows on INNER JOIN", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .innerJoinAndSelect("user.conversations", "conversation")
                    .withDeleted()

                const sql = qb.getQuery()
                sql.should.contain("INNER JOIN")
                sql.should.not.match(/deletedAt["`]?\s+IS\s+NULL/i)
            }),
        ))

    it("multiple withDeleted() calls should apply to their respective preceding joins independently", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                // Soft-delete a message too
                const msg2 = await dataSource
                    .getRepository(Message)
                    .findOne({ where: { text: "Hello from deleted" } })
                if (msg2) await dataSource.manager.softRemove(msg2)

                // Both joins get withDeleted
                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withDeleted()
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withDeleted()
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(2)

                const messages = users[0].conversations.flatMap(
                    (c) => c.messages,
                )
                messages.length.should.be.equal(2)
            }),
        ))

    it("withDeleted() on second join only should still filter soft-deleted rows on first join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seedData(dataSource)

                // Only the message join gets withDeleted, conversation join keeps the filter
                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withDeleted()
                    .getMany()

                users.length.should.be.equal(1)

                // Only active conversation (soft-delete filter still applied)
                users[0].conversations.length.should.be.equal(1)
                users[0].conversations[0].title.should.be.equal("Active Conv")
            }),
        ))
})
