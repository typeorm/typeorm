import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import "reflect-metadata"

import { DataSource, Repository } from "../../../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Setting } from "./entity/Setting"
import { User } from "./entity/User"

describe("persistence > orphanage > disable", () => {
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

    describe("when a User is updated without all settings being loaded...", () => {
        let userRepo: Repository<User>
        let settingRepo: Repository<Setting>
        let userId: number

        beforeEach(async function (context) {
            if (connections.length === 0) {
                context.skip()
            }

            await Promise.all(
                connections.map(async (connection) => {
                    userRepo = connection.getRepository(User)
                    settingRepo = connection.getRepository(Setting)
                }),
            )

            const user = await userRepo.save(new User("test-user"))
            user.settings = [
                new Setting("foo"),
                new Setting("bar"),
                new Setting("moo"),
            ]

            await userRepo.save(user)
            userId = user.id

            const userToUpdate = (await userRepo.findOneBy({ id: userId }))!
            userToUpdate.settings = [
                // untouched setting
                userToUpdate.settings[0],
                // updated setting
                { ...userToUpdate.settings[1], data: "bar_updated" },
                // skipped setting
                // new Setting("moo"),
                // new setting
                new Setting("cow"),
            ]

            await userRepo.save(userToUpdate)
        })

        it("should not delete setting with orphanedRowAction=disabed", async () => {
            const user = await userRepo.findOneBy({ id: userId })
            expect(user).not.to.be.undefined
            expect(user!.settings).to.have.lengthOf(4)
        })

        it("should not orphane any Settings", async () => {
            const itemsWithoutForeignKeys = (await settingRepo.find()).filter(
                (p) => !p.userId,
            )
            expect(itemsWithoutForeignKeys).to.have.lengthOf(0)
        })
    })
})
