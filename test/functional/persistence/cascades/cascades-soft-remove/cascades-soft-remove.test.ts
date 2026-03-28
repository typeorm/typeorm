import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"
import { IsNull } from "../../../../../src"

describe("persistence > cascades > softRemove", () => {
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
                await dataSource.manager.save(new Photo("Photo #1"))

                const user = new User()
                user.id = 1
                user.name = "Mr. Cascade Danger"
                user.manyPhotos = [
                    new Photo("one-to-many #1"),
                    new Photo("one-to-many #2"),
                ]
                user.manyToManyPhotos = [
                    new Photo("many-to-many #1"),
                    new Photo("many-to-many #2"),
                    new Photo("many-to-many #3"),
                ]
                await dataSource.manager.save(user)

                const loadedUser = await dataSource.manager
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.manyPhotos", "manyPhotos")
                    .leftJoinAndSelect(
                        "user.manyToManyPhotos",
                        "manyToManyPhotos",
                    )
                    .getOne()

                loadedUser!.id.should.be.equal(1)
                loadedUser!.name.should.be.equal("Mr. Cascade Danger")

                const manyPhotoNames = loadedUser!.manyPhotos.map(
                    (photo) => photo.name,
                )
                manyPhotoNames.length.should.be.equal(2)
                manyPhotoNames.should.deep.include("one-to-many #1")
                manyPhotoNames.should.deep.include("one-to-many #2")

                const manyToManyPhotoNames = loadedUser!.manyToManyPhotos.map(
                    (photo) => photo.name,
                )
                manyToManyPhotoNames.length.should.be.equal(3)
                manyToManyPhotoNames.should.deep.include("many-to-many #1")
                manyToManyPhotoNames.should.deep.include("many-to-many #2")
                manyToManyPhotoNames.should.deep.include("many-to-many #3")

                await dataSource.manager.softRemove(user)

                const allPhotos = await dataSource.manager.findBy(Photo, {
                    deletedAt: IsNull(),
                })
                allPhotos.length.should.be.equal(1)
                allPhotos[0].name.should.be.equal("Photo #1")
            }),
        ))

    it("recovers 1-many relations after soft-remove cascade", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.id = 2
                user.name = "Mr. Cascade Danger"
                user.manyPhotos = [
                    new Photo("one-to-many-to-restore #1"),
                    new Photo("one-to-many-to-restore #2"),
                ]
                await dataSource.manager.save(user)
                await dataSource.manager.softRemove(user)
                // sanity check photos are soft-removed
                const allDeletedPhotos = await dataSource.manager.find(Photo)
                allDeletedPhotos.length.should.be.equal(0)

                // and can be retrieved if we ask for them
                const allPhotos = await dataSource.manager.find(Photo, {
                    withDeleted: true,
                })
                allPhotos.length.should.be.equal(2)

                // recover user..
                await dataSource.manager.recover(user)
                // photos should be recovered as well
                const allRecoveredPhotos = await dataSource.manager.find(Photo)
                allRecoveredPhotos.length.should.be.equal(2)
            }),
        ))

    // recovery fails with "QueryFailedError: duplicate key value violates unique constraint"
    it.skip("recovers many-many relations after soft-remove cascade", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.id = 2
                user.name = "Mr. Cascade Danger"
                user.manyToManyPhotos = [
                    new Photo("many-to-many-to-recover #1"),
                    new Photo("many-to-many-to-recover #2"),
                ]
                await dataSource.manager.save(user)
                await dataSource.manager.softRemove(user)
                // sanity check photos are soft-removed
                const allDeletedPhotos = await dataSource.manager.find(Photo)
                allDeletedPhotos.length.should.be.equal(0)

                // and can be retrieved if we ask for them
                const allPhotos = await dataSource.manager.find(Photo, {
                    withDeleted: true,
                })
                allPhotos.length.should.be.equal(1)

                // recover user..
                await dataSource.manager.recover(user)
                // photos should be recovered as well
                const allRecoveredPhotos = await dataSource.manager.find(Photo)
                allRecoveredPhotos.length.should.be.equal(2)
            }),
        ))
})
