import "reflect-metadata"
import { expect } from "chai"

// Entities (note: User and UserProfile classes are named `a`; we alias them here)
import { a as User } from "./entity/User"
import { a as UserProfile } from "./entity/UserProfile"
import { ProfileComment } from "./entity/ProfileComment"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("metadata > entity target name", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // ---------------------------------------------------------------------------
    describe("repository lookup priority", () => {
        it("resolves by explicit targetName (User), falls back to displayName (UserProfile), then class name (ProfileComment)", () =>
            Promise.all(
                dataSources.map(async (ds) => {
                    // 1) Highest priority: explicit targetName -> "User"
                    const userRepo = ds.getRepository<User>("User")
                    const u = await userRepo.save(
                        userRepo.create({
                            name: "Ada",
                            email: "ada@example.com",
                        }),
                    )
                    const uAgain = await userRepo.findOneByOrFail({ id: u.id })
                    expect(uAgain.name).to.equal("Ada")
                    expect(ds.getMetadata("User").target).to.equal(User)

                    // 2) Fallback: static displayName -> "UserProfile"
                    const profileRepo =
                        ds.getRepository<UserProfile>("UserProfile")
                    const p = await profileRepo.save(
                        profileRepo.create({ bio: "hello" }),
                    )
                    const pAgain = await profileRepo.findOneByOrFail({
                        id: p.id,
                    })
                    expect(pAgain.bio).to.equal("hello")
                    expect(ds.getMetadata("UserProfile").target).to.equal(
                        UserProfile,
                    )

                    // 3) Last resort: class name -> "ProfileComment"
                    const commentRepo =
                        ds.getRepository<ProfileComment>("ProfileComment")
                    const c = await commentRepo.save(
                        commentRepo.create({ body: "first!" }),
                    )
                    const cAgain = await commentRepo.findOneByOrFail({
                        id: c.id,
                    })
                    expect(cAgain.body).to.equal("first!")
                    expect(ds.getMetadata("ProfileComment").target).to.equal(
                        ProfileComment,
                    )
                }),
            ))
    })

    // ---------------------------------------------------------------------------
    describe("relations using string-based entity names", () => {
        it("User (targetName) ↔ UserProfile (displayName) one-to-one works both sides", () =>
            Promise.all(
                dataSources.map(async (ds) => {
                    const userRepo = ds.getRepository<User>("User")
                    const profileRepo =
                        ds.getRepository<UserProfile>("UserProfile")

                    const u = await userRepo.save(
                        userRepo.create({ name: "Neo", email: "neo@io" }),
                    )
                    await profileRepo.save(
                        profileRepo.create({ bio: "the one", user: u }),
                    )

                    // Load owning side (UserProfile -> User)
                    const prof = await profileRepo.findOneOrFail({
                        where: { user: { id: u.id } },
                        relations: ["user"],
                    })
                    expect(prof.user.email).to.equal("neo@io")

                    // Load inverse side (User -> UserProfile)
                    const withProfile = await userRepo.findOneOrFail({
                        where: { id: u.id },
                        relations: ["profile"],
                    })
                    expect(withProfile.profile.bio).to.equal("the one")
                }),
            ))

        it("UserProfile (displayName) → ProfileComment (class name) one-to-many and inverse many-to-one", () =>
            Promise.all(
                dataSources.map(async (ds) => {
                    const userRepo = ds.getRepository<User>("User")
                    const profileRepo =
                        ds.getRepository<UserProfile>("UserProfile")
                    const commentRepo =
                        ds.getRepository<ProfileComment>("ProfileComment")

                    const u = await userRepo.save(
                        userRepo.create({ name: "Grace", email: "grace@ex" }),
                    )
                    const profile = await profileRepo.save(
                        profileRepo.create({ bio: "coder", user: u }),
                    )

                    await commentRepo.save([
                        commentRepo.create({ body: "hey", profile, author: u }),
                        commentRepo.create({
                            body: "there",
                            profile,
                            author: u,
                        }),
                    ])

                    // Load comments from profile (OneToMany)
                    const profWithComments = await profileRepo.findOneOrFail({
                        where: { id: profile.id },
                        relations: ["comments"],
                    })
                    expect(
                        profWithComments.comments.map((c) => c.body).sort(),
                    ).to.deep.equal(["hey", "there"])

                    // Load inverse (ManyToOne) with profile relation too
                    const loadedComments = await commentRepo.find({
                        where: { profile: { id: profile.id } },
                        relations: ["profile", "author"],
                        order: { id: "ASC" },
                    })
                    expect(loadedComments).to.have.length(2)
                    expect(loadedComments[0].profile.bio).to.equal("coder")
                    expect(loadedComments[0].author.name).to.equal("Grace")
                }),
            ))

        it("User (targetName) → ProfileComment (class name) one-to-many via author field", () =>
            Promise.all(
                dataSources.map(async (ds) => {
                    const userRepo = ds.getRepository<User>("User")
                    const profileRepo =
                        ds.getRepository<UserProfile>("UserProfile")
                    const commentRepo =
                        ds.getRepository<ProfileComment>("ProfileComment")

                    const u = await userRepo.save(
                        userRepo.create({ name: "QB", email: "qb@ex" }),
                    )
                    const profile = await profileRepo.save(
                        profileRepo.create({ bio: "bio", user: u }),
                    )

                    await commentRepo.save([
                        commentRepo.create({
                            body: "alpha",
                            profile,
                            author: u,
                        }),
                        commentRepo.create({
                            body: "beta",
                            profile,
                            author: u,
                        }),
                    ])

                    const userWithComments = await userRepo.findOneOrFail({
                        where: { id: u.id },
                        relations: ["authoredComments"],
                    })

                    expect(
                        userWithComments.authoredComments
                            .map((c) => c.body)
                            .sort(),
                    ).to.deep.equal(["alpha", "beta"])
                }),
            ))
    })

    // ---------------------------------------------------------------------------
    describe("query builder using string entity keys", () => {
        it("joins User and ProfileComment by string names", () =>
            Promise.all(
                dataSources.map(async (ds) => {
                    const userRepo = ds.getRepository<User>("User")
                    const profileRepo =
                        ds.getRepository<UserProfile>("UserProfile")
                    const commentRepo =
                        ds.getRepository<ProfileComment>("ProfileComment")

                    const u = await userRepo.save(
                        userRepo.create({ name: "Zoe", email: "zoe@ex" }),
                    )
                    const profile = await profileRepo.save(
                        profileRepo.create({ bio: "z", user: u }),
                    )
                    await commentRepo.save(
                        commentRepo.create({ body: "hi", profile, author: u }),
                    )

                    // FROM uses ProfileComment class name; JOIN uses string entity keys
                    const rows = await ds
                        .createQueryBuilder("ProfileComment", "c")
                        .leftJoinAndSelect("User", "u", "u.id = c.authorId")
                        .leftJoinAndSelect(
                            "UserProfile",
                            "p",
                            "p.id = c.profileId",
                        )
                        .where("u.email = :email", { email: "zoe@ex" })
                        .getMany()

                    expect(rows).to.have.length(1)
                    expect(rows[0].body).to.equal("hi")
                }),
            ))
    })
})
