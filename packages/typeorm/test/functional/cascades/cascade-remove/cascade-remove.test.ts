import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"

describe("cascades > remove", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            __dirname,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should remove everything by cascades properly", () =>
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
                    .getOneOrFail()

                expect(loadedUser.id).to.equal(1)
                expect(loadedUser.name).to.equal("Mr. Cascade Danger")

                const manyPhotoNames = loadedUser.manyPhotos.map(
                    (photo) => photo.name,
                )
                expect(manyPhotoNames.length).to.equal(2)
                expect(manyPhotoNames).to.deep.include("one-to-many #1")
                expect(manyPhotoNames).to.deep.include("one-to-many #2")

                const manyToManyPhotoNames = loadedUser.manyToManyPhotos.map(
                    (photo) => photo.name,
                )
                expect(manyToManyPhotoNames.length).to.equal(3)
                expect(manyToManyPhotoNames).to.deep.include("many-to-many #1")
                expect(manyToManyPhotoNames).to.deep.include("many-to-many #2")
                expect(manyToManyPhotoNames).to.deep.include("many-to-many #3")

                await dataSource.manager.remove(loadedUser)

                const allPhotos = await dataSource.manager.find(Photo)
                expect(allPhotos.length).to.equal(1)
                expect(allPhotos[0].name).to.equal("Photo #1")
            }),
        ))
})
