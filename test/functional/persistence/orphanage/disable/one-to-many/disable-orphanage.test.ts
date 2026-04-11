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

    it("should not delete or nullify orphaned entities when orphanedRowAction is disable on @OneToMany", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepo = dataSource.getRepository(User)
                const settingRepo = dataSource.getRepository(Setting)

                const user = new User("test-user")
                user.settings = [
                    new Setting("foo"),
                    new Setting("bar"),
                    new Setting("baz"),
                ]
                await userRepo.save(user)

                const loaded = await userRepo.findOneByOrFail({
                    id: user.id,
                })
                // Remove one setting, keep two
                loaded.settings = loaded.settings.filter(
                    (s) => s.data !== "baz",
                )
                await userRepo.save(loaded)

                // All settings should still exist (orphan not removed)
                const allSettings = await settingRepo.find()
                expect(allSettings).to.have.lengthOf(3)

                // All FKs should still be intact
                const withoutFK = allSettings.filter((s) => !s.userId)
                expect(withoutFK).to.have.lengthOf(0)
            }),
        ))
})
