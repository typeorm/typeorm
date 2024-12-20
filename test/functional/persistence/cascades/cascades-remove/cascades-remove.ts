import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"
import { expect } from "chai"

// todo: fix later
describe("persistence > cascades > remove", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                __dirname,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should remove everything by cascades properly", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.save(new Photo("Photo #1"))
                const photoOneToMany1 = new Photo("one-to-many #1")

                const user = new User()
                user.id = 1
                user.name = "Mr. Cascade Danger"
                user.manyPhotos = [photoOneToMany1, new Photo("one-to-many #2")]
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

                expect(loadedUser!.id).to.be.eql(1)
                expect(loadedUser!.name).to.be.eql("Mr. Cascade Danger")

                const manyPhotoNames = loadedUser!.manyPhotos.map(
                    (photo) => photo.name,
                )

                expect(manyPhotoNames.length).to.be.eql(2)
                expect(manyPhotoNames).to.include("one-to-many #1")
                expect(manyPhotoNames).to.include("one-to-many #2")

                const manyToManyPhotoNames = loadedUser!.manyToManyPhotos.map(
                    (photo) => photo.name,
                )

                expect(manyToManyPhotoNames.length).to.be.eql(3)
                expect(manyToManyPhotoNames).to.include("many-to-many #1")
                expect(manyToManyPhotoNames).to.include("many-to-many #2")
                expect(manyToManyPhotoNames).to.include("many-to-many #3")

                await connection.manager.remove(user)

                const allPhotos = await connection.manager.find(Photo)

                expect(allPhotos.length).to.be.eql(1)
                expect(allPhotos[0].name).to.be.eql("Photo #1")
                expect(photoOneToMany1.isRemoved).to.be.true
            }),
        ))
})
