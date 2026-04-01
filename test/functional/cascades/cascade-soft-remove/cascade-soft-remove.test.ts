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

    it("recovers many-many relations after soft-remove cascade", async () =>
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

    it("recovers user without duplicate junction inserts when M2M has no cascade recover", async () =>
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
                // attempt duplicate inserts for the existing M2M bindings
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
})
