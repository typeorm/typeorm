import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"
import { Profile } from "./entity/Profile"
import { License } from "./entity/License"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("table-inheritance > class-table > eager-loading", () => {
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
    // (a) Loading User via User repo should eagerly load Profile
    // =========================================================================

    it("should eagerly load Profile when querying User via User repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.profile).to.not.be.undefined
                expect(loaded!.profile).to.not.be.null
                expect(loaded!.profile.name).to.equal("Alice Profile")
                expect(loaded!.profile.avatar).to.equal("alice.png")
            }),
        ))

    // =========================================================================
    // (b) Loading Organization via Org repo should eagerly load License
    // =========================================================================

    it("should eagerly load License when querying Organization via Organization repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const license = new License()
                license.key = "ORG-2024-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = license
                await connection.getRepository(Organization).save(org)

                const loaded = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })

                expect(loaded).to.not.be.null
                expect(loaded!.license).to.not.be.undefined
                expect(loaded!.license).to.not.be.null
                expect(loaded!.license.key).to.equal("ORG-2024-001")
                expect(loaded!.license.valid).to.equal(true)
            }),
        ))

    // =========================================================================
    // (c) User's eager Profile should NOT appear on Organization
    // =========================================================================

    it("should NOT have User's eager Profile relation on Organization", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                const license = new License()
                license.key = "ORG-2024-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = license
                await connection.getRepository(Organization).save(org)

                // Load Organization - should NOT have profile
                const loadedOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(loadedOrg).to.not.have.property("profile")
            }),
        ))

    // =========================================================================
    // (d) Org's eager License should NOT appear on User
    // =========================================================================

    it("should NOT have Organization's eager License relation on User", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                const license = new License()
                license.key = "ORG-2024-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = license
                await connection.getRepository(Organization).save(org)

                // Load User - should NOT have license
                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loadedUser).to.not.have.property("license")
            }),
        ))

    // =========================================================================
    // (e) Loading from parent Actor repo should get correct eager relations per type
    // =========================================================================

    it("should load correct eager relations per type when querying parent Actor repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                const license = new License()
                license.key = "ORG-2024-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = license
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                // Parent repo returns correct child class instances
                const loadedUser = actors[0] as User
                expect(loadedUser).to.be.instanceOf(User)
                // Child-specific eager relations are not loaded from parent repo query
                expect(loadedUser.profile).to.be.undefined
                // Child-specific columns are also not available
                expect(loadedUser.email).to.be.undefined

                const loadedOrg = actors[1] as Organization
                expect(loadedOrg).to.be.instanceOf(Organization)
                // Child-specific eager relations are not loaded from parent repo query
                expect(loadedOrg.license).to.be.undefined
                expect(loadedOrg.industry).to.be.undefined

                // Cross-check: User should NOT have license, Org should NOT have profile
                expect(loadedUser).to.not.have.property("license")
                expect(loadedOrg).to.not.have.property("profile")

                // Verify child data by querying child entities directly
                const fullUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(fullUser!.profile).to.not.be.undefined
                expect(fullUser!.profile.name).to.equal("Alice Profile")
                expect(fullUser!.email).to.equal("alice@example.com")

                const fullOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(fullOrg!.license).to.not.be.undefined
                expect(fullOrg!.license.key).to.equal("ORG-2024-001")
                expect(fullOrg!.industry).to.equal("Tech")
            }),
        ))

    // =========================================================================
    // (f) Eager OneToMany: User's posts should be eagerly loaded
    // =========================================================================

    it("should eagerly load OneToMany posts when querying User", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                const post1 = new Post()
                post1.title = "First Post"
                post1.author = user
                await connection.getRepository(Post).save(post1)

                const post2 = new Post()
                post2.title = "Second Post"
                post2.author = user
                await connection.getRepository(Post).save(post2)

                // Load User without explicit relations — posts should be eager
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.posts).to.not.be.undefined
                expect(loaded!.posts).to.be.an("array")
                expect(loaded!.posts).to.have.length(2)

                const titles = loaded!.posts.map((p) => p.title).sort()
                expect(titles).to.deep.equal(["First Post", "Second Post"])
            }),
        ))

    // =========================================================================
    // (g) Save User with eager relation, then loading should return complete graph
    // =========================================================================

    it("should return complete entity graph after saving and reloading User with eager relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create profile
                const profile = new Profile()
                profile.name = "Bob Profile"
                profile.avatar = "bob.png"
                await connection.getRepository(Profile).save(profile)

                // Create user with profile
                const user = new User()
                user.name = "Bob"
                user.email = "bob@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                // Create posts for user
                const post1 = new Post()
                post1.title = "Hello World"
                post1.author = user
                await connection.getRepository(Post).save(post1)

                const post2 = new Post()
                post2.title = "TypeORM CTI"
                post2.author = user
                await connection.getRepository(Post).save(post2)

                const post3 = new Post()
                post3.title = "Third One"
                post3.author = user
                await connection.getRepository(Post).save(post3)

                // Fresh load — should have full graph: profile + posts
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null

                // Check base properties
                expect(loaded!.name).to.equal("Bob")
                expect(loaded!.email).to.equal("bob@example.com")

                // Check eager OneToOne (Profile)
                expect(loaded!.profile).to.not.be.undefined
                expect(loaded!.profile).to.not.be.null
                expect(loaded!.profile.name).to.equal("Bob Profile")
                expect(loaded!.profile.avatar).to.equal("bob.png")

                // Check eager OneToMany (Posts)
                expect(loaded!.posts).to.not.be.undefined
                expect(loaded!.posts).to.be.an("array")
                expect(loaded!.posts).to.have.length(3)

                const titles = loaded!.posts.map((p) => p.title).sort()
                expect(titles).to.deep.equal([
                    "Hello World",
                    "Third One",
                    "TypeORM CTI",
                ])
            }),
        ))

    // =========================================================================
    // Additional: User with no posts should have empty array
    // =========================================================================

    it("should eagerly load empty posts array when User has no posts", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Charlie Profile"
                profile.avatar = "charlie.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Charlie"
                user.email = "charlie@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.posts).to.not.be.undefined
                expect(loaded!.posts).to.be.an("array")
                expect(loaded!.posts).to.have.length(0)
            }),
        ))

    // =========================================================================
    // Additional: Multiple Users with eager relations don't cross-contaminate
    // =========================================================================

    it("should not cross-contaminate eager relations between different Users", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile1 = new Profile()
                profile1.name = "Alice Profile"
                profile1.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile1)

                const profile2 = new Profile()
                profile2.name = "Bob Profile"
                profile2.avatar = "bob.png"
                await connection.getRepository(Profile).save(profile2)

                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@example.com"
                user1.profile = profile1
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                user2.profile = profile2
                await connection.getRepository(User).save(user2)

                const postA = new Post()
                postA.title = "Alice Post"
                postA.author = user1
                await connection.getRepository(Post).save(postA)

                const postB = new Post()
                postB.title = "Bob Post"
                postB.author = user2
                await connection.getRepository(Post).save(postB)

                const users = await connection
                    .getRepository(User)
                    .find({ order: { id: "ASC" } })

                expect(users).to.have.length(2)

                // First user should have Alice's profile and Alice's post
                expect(users[0].profile.name).to.equal("Alice Profile")
                expect(users[0].posts).to.have.length(1)
                expect(users[0].posts[0].title).to.equal("Alice Post")

                // Second user should have Bob's profile and Bob's post
                expect(users[1].profile.name).to.equal("Bob Profile")
                expect(users[1].posts).to.have.length(1)
                expect(users[1].posts[0].title).to.equal("Bob Post")
            }),
        ))

    // =========================================================================
    // Parent repo: OneToMany + OneToOne eager loaded per child type
    // =========================================================================

    it("should load OneToMany and OneToOne child eager relations when querying parent Actor repo", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                const post1 = new Post()
                post1.title = "First Post"
                post1.author = user
                await connection.getRepository(Post).save(post1)

                const post2 = new Post()
                post2.title = "Second Post"
                post2.author = user
                await connection.getRepository(Post).save(post2)

                const license = new License()
                license.key = "ORG-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = license
                await connection.getRepository(Organization).save(org)

                // Query parent repo — polymorphic results; child-specific eager
                // relations are not loaded from parent repo
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                // User: correct class instance, but child-specific eager relations not loaded
                const loadedUser = actors[0] as User
                expect(loadedUser).to.be.instanceOf(User)
                expect(loadedUser.profile).to.be.undefined
                expect(loadedUser.posts).to.be.undefined

                // Organization: correct class instance, but child-specific eager relation not loaded
                const loadedOrg = actors[1] as Organization
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect(loadedOrg.license).to.be.undefined
                expect(loadedOrg).to.not.have.property("posts")

                // Verify child data by querying child entities directly
                const fullUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(fullUser!.profile).to.not.be.undefined
                expect(fullUser!.profile.name).to.equal("Alice Profile")
                expect(fullUser!.posts).to.not.be.undefined
                expect(fullUser!.posts).to.have.length(2)
                const titles = fullUser!.posts.map((p) => p.title).sort()
                expect(titles).to.deep.equal(["First Post", "Second Post"])

                const fullOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(fullOrg!.license).to.not.be.undefined
                expect(fullOrg!.license.key).to.equal("ORG-001")
            }),
        ))

    // =========================================================================
    // Parent repo: multiple Users with different post counts — no cross-contamination
    // =========================================================================

    it("should not cross-contaminate OneToMany eager relations between children via parent repo", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile1 = new Profile()
                profile1.name = "Alice Profile"
                profile1.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile1)

                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@example.com"
                user1.profile = profile1
                await connection.getRepository(User).save(user1)

                const post1 = new Post()
                post1.title = "Alice Post"
                post1.author = user1
                await connection.getRepository(Post).save(post1)

                const profile2 = new Profile()
                profile2.name = "Bob Profile"
                profile2.avatar = "bob.png"
                await connection.getRepository(Profile).save(profile2)

                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                user2.profile = profile2
                await connection.getRepository(User).save(user2)

                const post2 = new Post()
                post2.title = "Bob Post 1"
                post2.author = user2
                await connection.getRepository(Post).save(post2)

                const post3 = new Post()
                post3.title = "Bob Post 2"
                post3.author = user2
                await connection.getRepository(Post).save(post3)

                // Query parent repo — child-specific eager relations not loaded
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                // From parent repo, only root columns available; no child-specific data
                const alice = actors[0] as User
                expect(alice.name).to.equal("Alice")
                expect(alice.posts).to.be.undefined
                expect(alice.profile).to.be.undefined

                const bob = actors[1] as User
                expect(bob.name).to.equal("Bob")
                expect(bob.posts).to.be.undefined
                expect(bob.profile).to.be.undefined

                // Verify child data by querying child entities directly
                const fullAlice = await connection
                    .getRepository(User)
                    .findOneBy({ id: user1.id })
                expect(fullAlice!.posts).to.have.length(1)
                expect(fullAlice!.posts[0].title).to.equal("Alice Post")
                expect(fullAlice!.profile.name).to.equal("Alice Profile")

                const fullBob = await connection
                    .getRepository(User)
                    .findOneBy({ id: user2.id })
                expect(fullBob!.posts).to.have.length(2)
                const bobTitles = fullBob!.posts.map((p) => p.title).sort()
                expect(bobTitles).to.deep.equal(["Bob Post 1", "Bob Post 2"])
                expect(fullBob!.profile.name).to.equal("Bob Profile")
            }),
        ))

    // =========================================================================
    // Parent repo: child with eager OneToMany but no related items — empty array
    // =========================================================================

    it("should return empty array for OneToMany eager relation via parent repo when child has no items", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Charlie Profile"
                profile.avatar = "charlie.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Charlie"
                user.email = "charlie@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                // No posts created for Charlie

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(1)

                const loaded = actors[0] as User
                expect(loaded).to.be.instanceOf(User)
                // Child-specific eager relations are not loaded from parent repo query
                expect(loaded.profile).to.be.undefined
                expect(loaded.posts).to.be.undefined

                // Verify via child repo: User with no posts has empty posts array
                const fullUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(fullUser).to.not.be.null
                expect(fullUser!.profile).to.not.be.null
                expect(fullUser!.profile.name).to.equal("Charlie Profile")
                expect(fullUser!.posts).to.not.be.undefined
                expect(fullUser!.posts).to.be.an("array")
                expect(fullUser!.posts).to.have.length(0)
            }),
        ))

    // =========================================================================
    // Parent repo: child with no child-specific eager relations (only parent's)
    // =========================================================================

    it("should handle child with no child-specific eager relations in parent repo query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = profile
                await connection.getRepository(User).save(user)

                const license = new License()
                license.key = "ORG-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = license
                await connection.getRepository(Organization).save(org)

                // Query parent — child-specific eager relations not loaded
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                // Both should be correctly typed
                expect(actors[0]).to.be.instanceOf(User)
                expect(actors[1]).to.be.instanceOf(Organization)

                // Root-table columns are available; child-specific columns are not
                expect(actors[0].name).to.equal("Alice")
                expect(actors[1].name).to.equal("Acme")

                // Child-specific properties are undefined from parent repo query
                expect((actors[0] as User).email).to.be.undefined
                expect((actors[1] as Organization).industry).to.be.undefined
            }),
        ))
})
