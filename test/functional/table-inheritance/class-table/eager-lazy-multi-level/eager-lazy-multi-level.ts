import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { Contributor } from "./entity/Contributor"
import { User } from "./entity/User"
import { Tag } from "./entity/Tag"
import { Badge } from "./entity/Badge"
import { Profile } from "./entity/Profile"
import { expect } from "chai"

describe("table-inheritance > class-table > eager-lazy-multi-level", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // =========================================================================
    // Helper: create a fully populated User (Actor -> Contributor -> User)
    // with Tag (grandparent), Badge (parent), and Profile (own)
    // =========================================================================

    async function createFullUser(
        connection: DataSource,
    ): Promise<{ user: User; tag: Tag; badge: Badge; profile: Profile }> {
        const tag = new Tag()
        tag.label = "user-tag"
        await connection.getRepository(Tag).save(tag)

        const badge = new Badge()
        badge.title = "Gold Contributor"
        await connection.getRepository(Badge).save(badge)

        const profile = new Profile()
        profile.name = "Alice Profile"
        await connection.getRepository(Profile).save(profile)

        const user = new User()
        user.name = "Alice"
        user.reputation = 100
        user.email = "alice@example.com"
        user.tag = tag
        user.badge = badge
        user.profile = profile
        await connection.getRepository(User).save(user)

        return { user, tag, badge, profile }
    }

    // =========================================================================
    // Helper: create a Contributor (Actor -> Contributor) with Tag and Badge
    // =========================================================================

    async function createContributor(
        connection: DataSource,
    ): Promise<{ contributor: Contributor; tag: Tag; badge: Badge }> {
        const tag = new Tag()
        tag.label = "contributor-tag"
        await connection.getRepository(Tag).save(tag)

        const badge = new Badge()
        badge.title = "Silver Contributor"
        await connection.getRepository(Badge).save(badge)

        const contributor = new Contributor()
        contributor.name = "Bob"
        contributor.reputation = 50
        contributor.tag = tag
        contributor.badge = badge
        await connection.getRepository(Contributor).save(contributor)

        return { contributor, tag, badge }
    }

    // =========================================================================
    // (a) Loading User should eagerly load ALL relations: Tag, Badge, Profile
    // =========================================================================

    it("should eagerly load grandparent Tag, parent Badge, and own Profile when querying User", () =>
        Promise.all(
            connections.map(async (connection) => {
                const { user } = await createFullUser(connection)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null

                // Grandparent (Actor) eager relation: Tag
                expect(loaded!.tag).to.not.be.undefined
                expect(loaded!.tag).to.not.be.null
                expect(loaded!.tag.label).to.equal("user-tag")

                // Parent (Contributor) eager relation: Badge
                expect(loaded!.badge).to.not.be.undefined
                expect(loaded!.badge).to.not.be.null
                expect(loaded!.badge.title).to.equal("Gold Contributor")

                // Own (User) eager relation: Profile
                expect(loaded!.profile).to.not.be.undefined
                expect(loaded!.profile).to.not.be.null
                expect(loaded!.profile.name).to.equal("Alice Profile")
            }),
        ))

    // =========================================================================
    // (b) Loading Contributor should eagerly load Tag + Badge (not Profile)
    // =========================================================================

    it("should eagerly load grandparent Tag and own Badge when querying Contributor (not Profile)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const { contributor } = await createContributor(connection)

                const loaded = await connection
                    .getRepository(Contributor)
                    .findOneBy({ id: contributor.id })

                expect(loaded).to.not.be.null

                // Grandparent (Actor) eager relation: Tag
                expect(loaded!.tag).to.not.be.undefined
                expect(loaded!.tag).to.not.be.null
                expect(loaded!.tag.label).to.equal("contributor-tag")

                // Own (Contributor) eager relation: Badge
                expect(loaded!.badge).to.not.be.undefined
                expect(loaded!.badge).to.not.be.null
                expect(loaded!.badge.title).to.equal("Silver Contributor")

                // Profile should NOT exist on Contributor
                expect((loaded as any).profile).to.be.undefined
            }),
        ))

    // =========================================================================
    // (c) Loading Actor root should eagerly load Tag for all types
    // =========================================================================

    it("should eagerly load Tag on all entities when querying root Actor repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag1 = new Tag()
                tag1.label = "actor-only-tag"
                await connection.getRepository(Tag).save(tag1)

                // Create a plain Actor (root entity)
                // Note: since Actor is abstract root with CTI, we test via
                // Contributor and User which both inherit Tag from Actor
                await createFullUser(connection)
                await createContributor(connection)

                // Load all from Actor repo
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors.length).to.be.greaterThanOrEqual(2)

                // Each actor should have its Tag eagerly loaded
                for (const actor of actors) {
                    expect(actor.tag).to.not.be.undefined
                    expect(actor.tag).to.not.be.null
                    expect(actor.tag.label).to.be.a("string")
                    expect(actor.tag.label.length).to.be.greaterThan(0)
                }

                // Verify specific tags
                const loadedUser = actors.find(
                    (a) => a instanceof User,
                ) as User
                expect(loadedUser).to.not.be.undefined
                expect(loadedUser.tag.label).to.equal("user-tag")

                const loadedContributor = actors.find(
                    (a) =>
                        a instanceof Contributor && !(a instanceof User),
                ) as Contributor
                expect(loadedContributor).to.not.be.undefined
                expect(loadedContributor.tag.label).to.equal(
                    "contributor-tag",
                )
            }),
        ))

    // =========================================================================
    // Additional: User queried via Contributor repo should still get all three
    // =========================================================================

    // TODO: Implement child-specific eager relation loading for CTI parent polymorphic queries.
    // When querying Contributor repo, User-specific eager relations (Profile) are not joined.
    it.skip("should eagerly load Tag, Badge, and Profile when User is loaded via Contributor repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createFullUser(connection)

                // Load via Contributor repo — User extends Contributor
                const contributors = await connection
                    .getRepository(Contributor)
                    .find({ order: { id: "ASC" } })

                const loadedUser = contributors.find(
                    (c) => c instanceof User,
                ) as User
                expect(loadedUser).to.not.be.undefined

                // Grandparent: Tag
                expect(loadedUser.tag).to.not.be.undefined
                expect(loadedUser.tag).to.not.be.null
                expect(loadedUser.tag.label).to.equal("user-tag")

                // Parent: Badge
                expect(loadedUser.badge).to.not.be.undefined
                expect(loadedUser.badge).to.not.be.null
                expect(loadedUser.badge.title).to.equal("Gold Contributor")

                // Own: Profile
                expect(loadedUser.profile).to.not.be.undefined
                expect(loadedUser.profile).to.not.be.null
                expect(loadedUser.profile.name).to.equal("Alice Profile")
            }),
        ))

    // =========================================================================
    // Additional: Contributor queried via Actor repo should have Tag and Badge
    // but NOT Profile
    // =========================================================================

    // TODO: Implement child-specific eager relation loading for CTI parent polymorphic queries.
    // Currently parent queries load child columns but not child-specific eager relations.
    it.skip("should eagerly load Tag and Badge (but not Profile) for Contributor loaded via Actor repo", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createContributor(connection)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                const loadedContributor = actors.find(
                    (a) =>
                        a instanceof Contributor && !(a instanceof User),
                ) as Contributor
                expect(loadedContributor).to.not.be.undefined

                // Tag (from Actor, root eager relation — already loaded by parent query)
                expect(loadedContributor.tag).to.not.be.undefined
                expect(loadedContributor.tag).to.not.be.null
                expect(loadedContributor.tag.label).to.equal(
                    "contributor-tag",
                )

                // Badge (from Contributor, child-specific eager relation)
                expect(loadedContributor.badge).to.not.be.undefined
                expect(loadedContributor.badge).to.not.be.null
                expect(loadedContributor.badge.title).to.equal(
                    "Silver Contributor",
                )

                // Profile should NOT exist on Contributor
                expect((loadedContributor as any).profile).to.be.undefined
            }),
        ))

    // =========================================================================
    // Additional: Verify that all three eager relations have correct data
    // after save and reload cycle
    // =========================================================================

    it("should preserve all three eager relation levels across save and reload cycle", () =>
        Promise.all(
            connections.map(async (connection) => {
                const { user, tag, badge, profile } =
                    await createFullUser(connection)

                // Reload from scratch
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null

                // Verify IDs match the original saved entities
                expect(loaded!.tag.id).to.equal(tag.id)
                expect(loaded!.badge.id).to.equal(badge.id)
                expect(loaded!.profile.id).to.equal(profile.id)

                // Verify data integrity
                expect(loaded!.tag.label).to.equal("user-tag")
                expect(loaded!.badge.title).to.equal("Gold Contributor")
                expect(loaded!.profile.name).to.equal("Alice Profile")

                // Verify entity's own columns
                expect(loaded!.name).to.equal("Alice")
                expect(loaded!.reputation).to.equal(100)
                expect(loaded!.email).to.equal("alice@example.com")
            }),
        ))

    // =========================================================================
    // Additional: Multiple Users each with distinct eager relations
    // =========================================================================

    it("should not cross-contaminate eager relations between multiple User instances", () =>
        Promise.all(
            connections.map(async (connection) => {
                // First user
                const tag1 = new Tag()
                tag1.label = "tag-one"
                await connection.getRepository(Tag).save(tag1)

                const badge1 = new Badge()
                badge1.title = "Badge One"
                await connection.getRepository(Badge).save(badge1)

                const profile1 = new Profile()
                profile1.name = "Profile One"
                await connection.getRepository(Profile).save(profile1)

                const user1 = new User()
                user1.name = "User One"
                user1.reputation = 10
                user1.email = "one@example.com"
                user1.tag = tag1
                user1.badge = badge1
                user1.profile = profile1
                await connection.getRepository(User).save(user1)

                // Second user
                const tag2 = new Tag()
                tag2.label = "tag-two"
                await connection.getRepository(Tag).save(tag2)

                const badge2 = new Badge()
                badge2.title = "Badge Two"
                await connection.getRepository(Badge).save(badge2)

                const profile2 = new Profile()
                profile2.name = "Profile Two"
                await connection.getRepository(Profile).save(profile2)

                const user2 = new User()
                user2.name = "User Two"
                user2.reputation = 20
                user2.email = "two@example.com"
                user2.tag = tag2
                user2.badge = badge2
                user2.profile = profile2
                await connection.getRepository(User).save(user2)

                // Load both
                const users = await connection
                    .getRepository(User)
                    .find({ order: { id: "ASC" } })

                expect(users).to.have.length(2)

                // First user's relations
                expect(users[0].tag.label).to.equal("tag-one")
                expect(users[0].badge.title).to.equal("Badge One")
                expect(users[0].profile.name).to.equal("Profile One")

                // Second user's relations
                expect(users[1].tag.label).to.equal("tag-two")
                expect(users[1].badge.title).to.equal("Badge Two")
                expect(users[1].profile.name).to.equal("Profile Two")
            }),
        ))
})
