import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"
import { IsNull } from "../../../../../src"

// todo: fix later
describe.skip("persistence > cascades > remove", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                __dirname,
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should soft-remove everything by cascades properly", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.save(new Photo("Photo #1"))

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
                await connection.manager.save(user)

                const loadedUser = await connection.manager
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

                await connection.manager.softRemove(user)

                const allPhotos = await connection.manager.findBy(Photo, {
                    deletedAt: IsNull(),
                })
                allPhotos.length.should.be.equal(1)
                allPhotos[0].name.should.be.equal("Photo #1")
            }),
        ))
})
