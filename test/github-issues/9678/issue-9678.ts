import { DataSource, Equal } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { User } from "./entity/user"
import { Photo } from "./entity/photo"
import { Tag } from "./entity/tag"
import { expect } from "chai"

describe("github issues > #9678 should not load relations with only VirtualColumn properties", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
                entities: [User, Photo, Tag],
            })),
    )

    after(() => closeTestingConnections(dataSources))

    it("should not load invalid relations with only virtual columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const fooUser = new User()
                fooUser.photos = []

                const userRepository = dataSource.getRepository(User)

                await userRepository.save(fooUser)

                expect(fooUser.id).to.be.greaterThan(0)
                expect(fooUser.photos).to.have.length(0)

                const retrievedUser = await userRepository.findOne({
                    where: {
                        id: Equal(fooUser.id),
                    },
                    relations: {
                        photos: true,
                    },
                })

                expect(retrievedUser).to.not.be.undefined
                expect(retrievedUser!.photos).to.have.length(0)
            }),
        ))

    it("should load relations if they have at least one non-virtual column property", async () =>
        Promise.all([
            dataSources.map(async (dataSource) => {
                const tagOne = new Tag()
                tagOne.value = "one"

                await dataSource.getRepository(Tag).save(tagOne)

                const photoFoo = new Photo()
                photoFoo.tags = [tagOne]

                await dataSource.getRepository(Photo).save(photoFoo)

                const fooUser = new User()
                fooUser.photos = [photoFoo]

                const userRepository = dataSource.getRepository(User)

                await userRepository.save(fooUser)

                expect(fooUser.id).to.be.greaterThan(0)
                expect(fooUser.photos).to.have.length(1)

                const retrievedUser = await userRepository.findOne({
                    where: {
                        id: Equal(fooUser.id),
                    },
                    relations: {
                        photos: true,
                    },
                })

                expect(retrievedUser).to.not.be.undefined
                expect(retrievedUser!.photos).to.have.length(1)
            }),
        ]))
})
