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
import { expect } from "chai"

describe("query builder > per-join withDeletedJoin, withDeleted and withGlobalDeleted", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // ---------------------------------------------------------------
    // Helper: seed data and soft-delete one conversation + one message
    // ---------------------------------------------------------------
    async function seed(dataSource: DataSource) {
        const user = new User()
        user.name = "Alice"
        await dataSource.manager.save(user)

        const conv1 = new Conversation()
        conv1.title = "conv#1"
        conv1.user = user
        await dataSource.manager.save(conv1)

        const conv2 = new Conversation()
        conv2.title = "conv#2"
        conv2.user = user
        await dataSource.manager.save(conv2)

        const msg1 = new Message()
        msg1.text = "msg#1"
        msg1.conversation = conv1
        await dataSource.manager.save(msg1)

        const msg2 = new Message()
        msg2.text = "msg#2"
        msg2.conversation = conv2
        await dataSource.manager.save(msg2)

        const msg3 = new Message()
        msg3.text = "msg#3"
        msg3.conversation = conv2
        await dataSource.manager.save(msg3)

        // soft-delete conv1 and msg3
        await dataSource.manager.softRemove(conv1)
        await dataSource.manager.softRemove(msg3)

        return { user, conv1, conv2, msg1, msg2, msg3 }
    }

    // ===============================================================
    // DEFAULT BEHAVIOR
    // ===============================================================

    it("should exclude soft-deleted rows from joins by default", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(1)
                users[0].conversations[0].title.should.be.equal("conv#2")
                users[0].conversations[0].messages.length.should.be.equal(1)
                users[0].conversations[0].messages[0].text.should.be.equal(
                    "msg#2",
                )
            }),
        ))

    // ===============================================================
    // FIX for PR #12560: withDeleted() must work regardless of call
    // order. The original bug: soft-delete condition was baked into
    // the JOIN ON clause at join-creation time, so calling
    // .withDeleted() AFTER .leftJoinAndSelect() had no effect on
    // joins — the "deletedAt IS NULL" was already permanently stuck.
    // The fix: evaluate the condition at query-build time instead.
    // ===============================================================

    it("withDeleted() should be global when called BEFORE joins", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { user } = await seed(dataSource)
                await dataSource.manager.softRemove(user)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .withDeleted()
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(2)
            }),
        ))

    it("withDeleted() called AFTER joins must still remove deletedAt IS NULL from joins (PR #12560 fix)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { user } = await seed(dataSource)
                await dataSource.manager.softRemove(user)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withDeleted()
                    .getMany()

                // withDeleted is GLOBAL — soft-deleted user, conversations, and messages all included
                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(2)
                const conv2 = users[0].conversations.find(
                    (c) => c.title === "conv#2",
                )!
                conv2.messages.length.should.be.equal(2)
            }),
        ))

    it("SQL proof: withDeleted() after joins must NOT have deletedAt IS NULL in JOIN ON clauses (PR #12560 fix)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                // This is the EXACT scenario that was broken before the fix:
                // withDeleted() called AFTER leftJoinAndSelect
                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withDeleted()

                const sql = qb.getSql()

                // BEFORE fix: SQL would contain "conversation.deletedAt IS NULL"
                // and "message.deletedAt IS NULL" in JOIN ON clauses because
                // the condition was set at join-creation time when withDeleted was still false.
                //
                // AFTER fix: these conditions should NOT appear because withDeleted()
                // is now evaluated at query-build time.
                sql.should.not.match(
                    /conversation["`]?\.["`]?deletedAt["`]?\s+IS\s+NULL/i,
                )
                sql.should.not.match(
                    /message["`]?\.["`]?deletedAt["`]?\s+IS\s+NULL/i,
                )
                sql.should.not.match(
                    /user["`]?\.["`]?deletedAt["`]?\s+IS\s+NULL/i,
                )
            }),
        ))

    // ===============================================================
    // withDeletedJoin() — PER-JOIN CONTROL
    // ===============================================================

    it("withDeletedJoin() should include soft-deleted rows only on the first join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withDeletedJoin()
                    .leftJoinAndSelect("conversation.messages", "message")
                    .getMany()

                users.length.should.be.equal(1)
                // conv1 is soft-deleted but included via withDeletedJoin
                users[0].conversations.length.should.be.equal(2)
                // msg3 is soft-deleted and NOT included (second join has no withDeletedJoin)
                const conv2 = users[0].conversations.find(
                    (c) => c.title === "conv#2",
                )!
                conv2.messages.length.should.be.equal(1)
                conv2.messages[0].text.should.be.equal("msg#2")
            }),
        ))

    it("withDeletedJoin() should include soft-deleted rows only on the second join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withDeletedJoin()
                    .getMany()

                users.length.should.be.equal(1)
                // conv1 is soft-deleted and NOT included (first join has no withDeletedJoin)
                users[0].conversations.length.should.be.equal(1)
                users[0].conversations[0].title.should.be.equal("conv#2")
                // msg3 IS included via withDeletedJoin on second join
                users[0].conversations[0].messages.length.should.be.equal(2)
            }),
        ))

    it("withDeletedJoin() on both joins should include soft-deleted rows on both", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withDeletedJoin()
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withDeletedJoin()
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(2)
                const conv2 = users[0].conversations.find(
                    (c) => c.title === "conv#2",
                )!
                conv2.messages.length.should.be.equal(2)
            }),
        ))

    it("withDeletedJoin() should NOT affect the main entity soft-delete filter", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { user } = await seed(dataSource)
                await dataSource.manager.softRemove(user)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withDeletedJoin()
                    .getMany()

                // user is soft-deleted and withDeletedJoin does NOT affect the main entity
                users.length.should.be.equal(0)
            }),
        ))

    it("withDeletedJoin() should work with innerJoinAndSelect", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .innerJoinAndSelect("user.conversations", "conversation")
                    .withDeletedJoin()
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(2)
            }),
        ))

    it("withDeletedJoin() should throw when called with no joins", () => {
        return Promise.all(
            dataSources.map(async (dataSource) => {
                expect(() => {
                    dataSource
                        .createQueryBuilder(User, "user")
                        .withDeletedJoin()
                }).to.throw(/must be called after a join method/)
            }),
        )
    })

    // ===============================================================
    // withGlobalDeleted() — EXPLICIT GLOBAL
    // ===============================================================

    it("withGlobalDeleted() should include soft-deleted rows on all joins", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withGlobalDeleted()
                    .getMany()

                users.length.should.be.equal(1)
                users[0].conversations.length.should.be.equal(2)
                const conv2 = users[0].conversations.find(
                    (c) => c.title === "conv#2",
                )!
                conv2.messages.length.should.be.equal(2)
            }),
        ))

    it("withGlobalDeleted() should also include soft-deleted main entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { user } = await seed(dataSource)
                await dataSource.manager.softRemove(user)

                const users = await dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withGlobalDeleted()
                    .getMany()

                users.length.should.be.equal(1)
                users[0].name.should.be.equal("Alice")
            }),
        ))

    // ===============================================================
    // SQL VERIFICATION
    // ===============================================================

    it("withDeletedJoin() should generate SQL without deletedAt IS NULL only on the targeted join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .withDeletedJoin()
                    .leftJoinAndSelect("conversation.messages", "message")

                const sql = qb.getSql()

                // conversation join should NOT have deletedAt IS NULL
                sql.should.not.match(
                    /conversation["`]?\.["`]?deletedAt["`]?\s+IS\s+NULL/i,
                )
                // message join SHOULD have deletedAt IS NULL
                sql.should.match(
                    /message["`]?\.["`]?deletedAt["`]?\s+IS\s+NULL/i,
                )
            }),
        ))

    it("withGlobalDeleted() should generate SQL without any deletedAt IS NULL on joins", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const qb = dataSource
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.conversations", "conversation")
                    .leftJoinAndSelect("conversation.messages", "message")
                    .withGlobalDeleted()

                const sql = qb.getSql()

                sql.should.not.match(
                    /conversation["`]?\.["`]?deletedAt["`]?\s+IS\s+NULL/i,
                )
                sql.should.not.match(
                    /message["`]?\.["`]?deletedAt["`]?\s+IS\s+NULL/i,
                )
            }),
        ))
})
