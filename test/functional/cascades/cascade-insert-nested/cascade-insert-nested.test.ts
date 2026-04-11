import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Profile } from "./entity/Profile"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"

describe("cascades > insert nested", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should insert everything by cascades properly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const photo = new Photo()
                photo.id = 1
                if (dataSource.driver.options.type === "spanner")
                    photo.name = "My photo"

                const profile = new Profile()
                profile.id = 1
                profile.photo = photo

                const user = new User()
                user.id = 1
                user.name = "Umed"
                user.profile = profile

                await dataSource.manager.save(user)

                const loadedUser = await dataSource.manager
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.profile", "profile")
                    .leftJoinAndSelect("profile.photo", "profilePhoto")
                    .leftJoinAndSelect("profile.user", "profileUser")
                    .getOne()

                expect(loadedUser).to.not.be.null
                expect(loadedUser).to.eql({
                    id: 1,
                    name: "Umed",
                    profile: {
                        id: 1,
                        photo: {
                            id: 1,
                            name: "My photo",
                        },
                        user: {
                            id: 1,
                            name: "Umed",
                        },
                    },
                })
            }),
        ))
})
