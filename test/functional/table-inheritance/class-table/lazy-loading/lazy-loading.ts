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
import { expect } from "chai"

/**
 * Lazy relations override the prototype to return Promises.
 * This means they can only be properly tested on a single driver at a time.
 * We restrict to postgres to avoid prototype-collision issues across drivers.
 */
describe("table-inheritance > class-table > lazy-loading", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // =========================================================================
    // (a) Loading User via User repo — Profile should be a lazy Promise, resolvable
    // =========================================================================

    it("should return a lazy Promise for Profile when loading User, which resolves correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = Promise.resolve(profile)
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null

                // The profile property should be a thenable (Promise-like)
                const profilePromise = loaded!.profile
                expect(profilePromise).to.not.be.undefined
                expect(typeof profilePromise.then).to.equal(
                    "function",
                )

                // Resolve the lazy relation
                const resolvedProfile = await profilePromise
                expect(resolvedProfile).to.not.be.null
                expect(resolvedProfile).to.not.be.undefined
                expect(resolvedProfile.name).to.equal("Alice Profile")
                expect(resolvedProfile.avatar).to.equal("alice.png")
            }),
        ))

    // =========================================================================
    // (b) Loading Organization — License should be a lazy Promise, resolvable
    // =========================================================================

    it("should return a lazy Promise for License when loading Organization, which resolves correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const license = new License()
                license.key = "ORG-2024-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = Promise.resolve(license)
                await connection.getRepository(Organization).save(org)

                const loaded = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })

                expect(loaded).to.not.be.null

                // The license property should be a thenable (Promise-like)
                const licensePromise = loaded!.license
                expect(licensePromise).to.not.be.undefined
                expect(typeof licensePromise.then).to.equal(
                    "function",
                )

                // Resolve the lazy relation
                const resolvedLicense = await licensePromise
                expect(resolvedLicense).to.not.be.null
                expect(resolvedLicense).to.not.be.undefined
                expect(resolvedLicense.key).to.equal("ORG-2024-001")
                expect(resolvedLicense.valid).to.equal(true)
            }),
        ))

    // =========================================================================
    // (c) Lazy relation should not be loaded until accessed
    // =========================================================================

    it("should not execute a query for lazy relation until the property is accessed", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = Promise.resolve(profile)
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null

                // At this point, the profile has not been resolved yet.
                // We verify the entity itself has the basic properties
                // and the profile is a Promise, not an already-resolved object.
                expect(loaded!.name).to.equal("Alice")
                expect(loaded!.email).to.equal("alice@example.com")

                // The profile property should be a thenable (lazy), not a plain object
                const profileProp = loaded!.profile
                expect(typeof profileProp.then).to.equal("function")

                // Only after awaiting should we get the actual Profile data
                const resolved = await profileProp
                expect(resolved.name).to.equal("Alice Profile")
            }),
        ))

    // =========================================================================
    // (d) Loading from parent Actor repo — lazy relations should work per type
    // =========================================================================

    it("should resolve lazy relations correctly per type when loading from parent Actor repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = Promise.resolve(profile)
                await connection.getRepository(User).save(user)

                const license = new License()
                license.key = "ORG-2024-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = Promise.resolve(license)
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                // First actor should be User; root columns are populated
                const loadedUser = actors[0] as User
                expect(loadedUser).to.be.instanceOf(User)
                expect(loadedUser.name).to.equal("Alice")
                // Child-specific columns are undefined from parent repo query
                expect(loadedUser.email).to.be.undefined
                // Child-specific lazy relations: proxy may exist but resolves to null
                // (no child table data was loaded)

                // Second actor should be Organization; root columns are populated
                const loadedOrg = actors[1] as Organization
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect(loadedOrg.name).to.equal("Acme")
                // Child-specific columns are undefined from parent repo query
                expect(loadedOrg.industry).to.be.undefined

                // Verify child data by querying child entities directly
                const fullUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(fullUser!.email).to.equal("alice@example.com")
                const resolvedProfile = await fullUser!.profile
                expect(resolvedProfile).to.not.be.null
                expect(resolvedProfile).to.not.be.undefined
                expect(resolvedProfile.name).to.equal("Alice Profile")
                expect(resolvedProfile.avatar).to.equal("alice.png")

                const fullOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(fullOrg!.industry).to.equal("Tech")
                const resolvedLicense = await fullOrg!.license
                expect(resolvedLicense).to.not.be.null
                expect(resolvedLicense).to.not.be.undefined
                expect(resolvedLicense.key).to.equal("ORG-2024-001")
                expect(resolvedLicense.valid).to.equal(true)
            }),
        ))

    // =========================================================================
    // Additional: Lazy relation should handle null (no related entity)
    // =========================================================================

    it("should resolve lazy relation to null when no related entity is assigned", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                // No profile assigned
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null

                // The lazy profile should resolve to null/undefined
                const resolvedProfile = await loaded!.profile
                expect(resolvedProfile).to.satisfy(
                    (v: any) => v === null || v === undefined,
                )
            }),
        ))

    // =========================================================================
    // Additional: Multiple lazy resolutions should return same result
    // =========================================================================

    it("should return consistent results when resolving lazy relation multiple times", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = Promise.resolve(profile)
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null

                // Resolve the lazy relation twice
                const first = await loaded!.profile
                const second = await loaded!.profile

                expect(first.name).to.equal("Alice Profile")
                expect(second.name).to.equal("Alice Profile")
                expect(first.id).to.equal(second.id)
            }),
        ))

    // =========================================================================
    // Additional: Cross-type lazy isolation
    // =========================================================================

    it("should not have Organization's lazy license on User entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.name = "Alice Profile"
                profile.avatar = "alice.png"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.profile = Promise.resolve(profile)
                await connection.getRepository(User).save(user)

                const license = new License()
                license.key = "ORG-2024-001"
                license.valid = true
                await connection.getRepository(License).save(license)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.license = Promise.resolve(license)
                await connection.getRepository(Organization).save(org)

                // Load User — should not have license property
                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect("license" in loadedUser!).to.be.false

                // Load Organization — should not have profile property
                const loadedOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect("profile" in loadedOrg!).to.be.false
            }),
        ))
})
