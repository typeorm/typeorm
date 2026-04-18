import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { User } from "./entity/User"
import { Setting } from "./entity/Setting"

describe("persistence > orphanage > disable > one-to-many", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function seedUser(dataSource: DataSource) {
        const userRepo = dataSource.getRepository(User)
        const user = new User("test-user")
        user.settings = [
            new Setting("foo"),
            new Setting("bar"),
            new Setting("baz"),
        ]
        await userRepo.save(user)
        return user
    }

    it("should not touch children when relation is not loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepo = dataSource.getRepository(User)
                const settingRepo = dataSource.getRepository(Setting)

                const user = await seedUser(dataSource)

                const loaded = await userRepo.findOneByOrFail({
                    id: user.id,
                })
                expect(loaded.settings).to.be.undefined
                loaded.name = "updated"
                await userRepo.save(loaded)

                expect(await settingRepo.count()).to.equal(3)
            }),
        ))

    it("should not touch children when relation is loaded but not modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepo = dataSource.getRepository(User)
                const settingRepo = dataSource.getRepository(Setting)

                const user = await seedUser(dataSource)

                const loaded = await userRepo.findOneOrFail({
                    where: { id: user.id },
                    relations: { settings: true },
                })
                expect(loaded.settings).to.have.lengthOf(3)

                loaded.name = "updated"
                await userRepo.save(loaded)

                expect(await settingRepo.count()).to.equal(3)
            }),
        ))

    it("should not touch children when relation is loaded and modified (disable)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepo = dataSource.getRepository(User)
                const settingRepo = dataSource.getRepository(Setting)

                const user = await seedUser(dataSource)

                const loaded = await userRepo.findOneOrFail({
                    where: { id: user.id },
                    relations: { settings: true },
                })
                loaded.settings = loaded.settings.filter(
                    (s) => s.data !== "baz",
                )
                await userRepo.save(loaded)

                // All settings should still exist (disable skips orphan handling)
                const allSettings = await settingRepo.find()
                expect(allSettings).to.have.lengthOf(3)

                // All FKs should still be intact
                const withoutFK = allSettings.filter((s) => !s.userId)
                expect(withoutFK).to.have.lengthOf(0)
            }),
        ))
})
