import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Photo } from "./entity/Photo"
import { Tag } from "./entity/Tag"
import { User } from "./entity/User"
import { IsNull } from "../../../../src"

describe("cascades > soft-remove", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should soft-remove everything by cascades properly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.save(
                    Photo.create({ name: "Photo #1" }),
                )

                const user = User.create({
                    id: 1,
                    name: "Mr. Cascade Danger",
                    manyPhotos: [
                        Photo.create({ name: "one-to-many #1" }),
                        Photo.create({ name: "one-to-many #2" }),
                    ],
                    manyToManyPhotos: [
                        Photo.create({ name: "many-to-many #1" }),
                        Photo.create({ name: "many-to-many #2" }),
                        Photo.create({ name: "many-to-many #3" }),
                    ],
                })
                await dataSource.manager.save(user)

                const loadedUser = await dataSource.manager
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.manyPhotos", "manyPhotos")
                    .leftJoinAndSelect(
                        "user.manyToManyPhotos",
                        "manyToManyPhotos",
                    )
                    .getOne()

                expect(loadedUser).to.not.be.null
                expect(loadedUser?.id).to.equal(1)
                expect(loadedUser?.name).to.equal("Mr. Cascade Danger")

                const manyPhotoNames = (loadedUser?.manyPhotos ?? []).map(
                    (photo) => photo.name,
                )
                expect(manyPhotoNames.length).to.equal(2)
                expect(manyPhotoNames).to.deep.include("one-to-many #1")
                expect(manyPhotoNames).to.deep.include("one-to-many #2")

                const manyToManyPhotoNames = (
                    loadedUser?.manyToManyPhotos ?? []
                ).map((photo) => photo.name)
                expect(manyToManyPhotoNames.length).to.equal(3)
                expect(manyToManyPhotoNames).to.deep.include("many-to-many #1")
                expect(manyToManyPhotoNames).to.deep.include("many-to-many #2")
                expect(manyToManyPhotoNames).to.deep.include("many-to-many #3")

                await dataSource.manager.softRemove(user)

                const allPhotos = await dataSource.manager.findBy(Photo, {
                    deletedAt: IsNull(),
                })
                expect(allPhotos.length).to.equal(1)
                expect(allPhotos[0].name).to.equal("Photo #1")
            }),
        ))

    it("recovers 1-many relations after soft-remove cascade", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = User.create({
                    id: 2,
                    name: "Mr. Cascade Danger",
                    manyPhotos: [
                        Photo.create({ name: "one-to-many-to-restore #1" }),
                        Photo.create({ name: "one-to-many-to-restore #2" }),
                    ],
                })
                await dataSource.manager.save(user)
                await dataSource.manager.softRemove(user)
                // sanity check photos are soft-removed
                const allDeletedPhotos = await dataSource.manager.find(Photo)
                expect(allDeletedPhotos.length).to.equal(0)

                // and can be retrieved if we ask for them
                const allPhotos = await dataSource.manager.find(Photo, {
                    withDeleted: true,
                })
                expect(allPhotos.length).to.equal(2)

                // recover user..
                await dataSource.manager.recover(user)
                // photos should be recovered as well
                const allRecoveredPhotos = await dataSource.manager.find(Photo)
                expect(allRecoveredPhotos.length).to.equal(2)
            }),
        ))

    it("recovers many-to-many relations after soft-remove cascade", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = User.create({
                    id: 2,
                    name: "Mr. Cascade Danger",
                    manyToManyPhotos: [
                        Photo.create({ name: "many-to-many-to-recover #1" }),
                        Photo.create({ name: "many-to-many-to-recover #2" }),
                    ],
                })
                await dataSource.manager.save(user)
                await dataSource.manager.softRemove(user)
                // sanity check photos are soft-removed
                const allDeletedPhotos = await dataSource.manager.find(Photo)
                expect(allDeletedPhotos.length).to.equal(0)

                // and can be retrieved if we ask for them
                const allPhotos = await dataSource.manager.find(Photo, {
                    withDeleted: true,
                })
                expect(allPhotos.length).to.equal(2)

                // recover user..
                await dataSource.manager.recover(user)
                // photos should be recovered as well
                const allRecoveredPhotos = await dataSource.manager.find(Photo)
                expect(allRecoveredPhotos.length).to.equal(2)
            }),
        ))

    it("recovers user without duplicate junction inserts when many-to-many has no cascade recover", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // tags relation has cascade: ["insert"] only, no recover
                const user = User.create({
                    id: 3,
                    name: "Mr. No Cascade Recover",
                    tags: [
                        Tag.create({ name: "tag-1" }),
                        Tag.create({ name: "tag-2" }),
                    ],
                })
                await dataSource.manager.save(user)

                // soft-remove only the user (tags stay because no cascade remove)
                await dataSource.manager.softRemove(user)

                // tags should still be active (no cascade soft-remove)
                const activeTags = await dataSource.manager.find(Tag)
                expect(activeTags.length).to.equal(2)

                // recover the user — junction rows still exist, should not
                // attempt duplicate inserts for the existing many-to-many bindings
                await dataSource.manager.recover(user)

                // verify junction rows are intact by loading user with tags
                const recovered = await dataSource.manager.findOne(User, {
                    where: { id: 3 },
                    relations: { tags: true },
                })
                expect(recovered).to.not.be.null
                expect(recovered?.tags.length).to.equal(2)
            }),
        ))

    it("recovers user when a many-to-many related entity is independently soft-deleted", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // create user with two tags (cascade: ["insert"] only)
                const tag1 = new Tag()
                tag1.name = "active-tag"
                const tag2 = new Tag()
                tag2.name = "soft-deleted-tag"
                await dataSource.manager.save(Tag, [tag1, tag2])

                const user = User.create({
                    id: 6,
                    name: "Mr. Independent Soft Delete",
                    tags: [tag1, tag2],
                })
                await dataSource.manager.save(user)

                // soft-remove the user (tags stay active — no cascade)
                await dataSource.manager.softRemove(user)

                // independently soft-delete tag2 (not via user cascade)
                await dataSource.manager.softRemove(Tag, tag2)

                // tag2 is now soft-deleted but its junction row still exists
                const activeTags = await dataSource.manager.find(Tag)
                expect(activeTags.length).to.equal(1)

                // recover the user — the relation ID loader must use
                // withDeleted to see the junction row for soft-deleted tag2,
                // otherwise it would attempt a duplicate junction INSERT
                await dataSource.manager.recover(
                    User.create({ id: 6, name: user.name }),
                )

                // verify both junction rows are intact
                const recovered = await dataSource.manager.findOneOrFail(User, {
                    where: { id: 6 },
                    relations: { tags: true },
                    withDeleted: true,
                })
                expect(recovered.tags.length).to.equal(2)
            }),
        ))

    it("save does not interfere with soft-deleted one-to-many relations", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // create user with one-to-many photos (cascade: true)
                const user = User.create({
                    id: 4,
                    name: "Mr. OneToMany Test",
                    manyPhotos: [
                        Photo.create({ name: "photo-to-soft-delete" }),
                    ],
                })
                await dataSource.manager.save(user)

                // soft-remove the user (cascades to photo)
                await dataSource.manager.softRemove(user)

                // verify photo is soft-deleted
                const activePhotos = await dataSource.manager.find(Photo)
                expect(activePhotos.length).to.equal(0)

                // recover only the user, without cascade to photo
                // by passing a plain object without the relation populated
                await dataSource.manager.recover(
                    User.create({ id: 4, name: user.name }),
                )

                // photo should still be soft-deleted
                const photosStillDeleted = await dataSource.manager.find(Photo)
                expect(photosStillDeleted.length).to.equal(0)

                // now save the user with an empty manyPhotos array —
                // the soft-deleted photo should NOT be "seen" by the
                // relation-id loader and should not trigger orphan handling
                const recoveredUser = await dataSource.manager.findOneByOrFail(
                    User,
                    { id: 4 },
                )
                recoveredUser.manyPhotos = []
                await dataSource.manager.save(recoveredUser)

                // the soft-deleted photo should remain untouched
                const photosAfterSave = await dataSource.manager.find(Photo, {
                    withDeleted: true,
                })
                expect(photosAfterSave.length).to.equal(1)
                expect(photosAfterSave[0].deletedAt).to.not.be.null
            }),
        ))

    it("save removes many-to-many junction row when soft-deleted entity is excluded from relation array", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // create photos and user with many-to-many binding
                const photo1 = new Photo()
                photo1.name = "active-photo"
                const photo2 = new Photo()
                photo2.name = "photo-to-soft-delete"
                await dataSource.manager.save(Photo, [photo1, photo2])

                const user = new User()
                user.id = 5
                user.name = "Mr. ManyToMany Save Test"
                user.manyToManyPhotos = [photo1, photo2]
                await dataSource.manager.save(user)

                // soft-delete photo2 independently (not via user cascade)
                await dataSource.manager.softRemove(Photo, photo2)

                // verify photo2 is soft-deleted
                const activePhotos = await dataSource.manager.find(Photo)
                expect(activePhotos.length).to.equal(1)
                expect(activePhotos[0].name).to.equal("active-photo")

                // save user with only photo1 — photo2 is explicitly excluded
                // the junction row for soft-deleted photo2 should be removed
                // because the relation array no longer includes it
                const loadedUser = await dataSource.manager.findOneOrFail(
                    User,
                    {
                        where: { id: 5 },
                        relations: { manyToManyPhotos: true },
                    },
                )
                loadedUser.manyToManyPhotos = [photo1]
                await dataSource.manager.save(loadedUser)

                // verify junction: user should only have photo1
                const userWithPhotos = await dataSource.manager.findOneOrFail(
                    User,
                    {
                        where: { id: 5 },
                        relations: { manyToManyPhotos: true },
                        withDeleted: true,
                    },
                )
                expect(userWithPhotos.manyToManyPhotos.length).to.equal(1)
                expect(userWithPhotos.manyToManyPhotos[0].name).to.equal(
                    "active-photo",
                )
            }),
        ))
})
