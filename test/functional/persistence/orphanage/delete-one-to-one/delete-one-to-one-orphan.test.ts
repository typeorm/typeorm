import { expect } from "chai"
import "reflect-metadata"

import { DataSource, Repository } from "../../../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Profile } from "./entity/Profile"
import { User } from "./entity/User"

describe("persistence > orphanage > delete > one-to-one", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: DataSource[] = []

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("when a Profile is removed from a User via setting relation to null", () => {
        let userRepository: Repository<User>
        let profileRepository: Repository<Profile>
        let userId: number

        beforeEach(async function () {
            if (connections.length === 0) {
                this.skip()
            }

            await Promise.all(
                connections.map(async (connection) => {
                    userRepository = connection.getRepository(User)
                    profileRepository = connection.getRepository(Profile)
                }),
            )

            const userToInsert = new User("test-user")
            userToInsert.profile = new Profile("test-bio")

            const savedUser = await userRepository.save(userToInsert)
            userId = savedUser.id

            // verify profile was created
            const profileCount = await profileRepository.count()
            expect(profileCount).to.equal(1)

            // now set the profile to null and save
            const userToUpdate = (await userRepository.findOneBy({
                id: userId,
            }))!
            userToUpdate.profile = null as any

            await userRepository.save(userToUpdate)
        })

        it("should delete the orphaned Profile from the database", async () => {
            const profileCount = await profileRepository.count()
            expect(profileCount).to.equal(0)
        })

        it("should still have the User in the database", async () => {
            const user = await userRepository.findOneBy({ id: userId })
            expect(user).not.to.be.undefined
            expect(user).not.to.be.null
            expect(user!.name).to.equal("test-user")
        })

        it("should have no profile on the User", async () => {
            const user = await userRepository.findOneBy({ id: userId })
            expect(user).not.to.be.undefined
            expect(user!.profile).to.be.null
        })
    })
})
