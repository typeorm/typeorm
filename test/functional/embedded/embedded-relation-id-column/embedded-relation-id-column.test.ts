import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Avatar } from "./entity/Avatar"
import { Profile, User } from "./entity/User"
import { expect } from "chai"

// https://github.com/typeorm/typeorm/issues/12725
describe("embedded > embedded-relation-id-column", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            disabledDrivers: ["spanner"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("merges the explicit id column with the relation join column (sanity check)", () => {
        for (const dataSource of dataSources) {
            const metadata = dataSource.getMetadata(User)
            const idColumn = metadata.columns.find(
                (c) => c.propertyPath === "profile.avatarId",
            )
            expect(idColumn).not.to.be.undefined
            expect(idColumn!.relationMetadata?.propertyPath).to.equal(
                "profile.avatar",
            )
            const columnsWithSameDbName = metadata.columns.filter(
                (c) => c.databaseName === idColumn!.databaseName,
            )
            expect(columnsWithSameDbName).to.have.length(1)
        }
    })

    it("persists a relation object assigned on a top-level property (control)", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const avatar = await dataSource
                    .getRepository(Avatar)
                    .save(new Avatar())

                const user = new User()
                user.profile = new Profile()
                user.topAvatar = avatar
                await dataSource.getRepository(User).save(user)

                const loaded = await dataSource
                    .getRepository(User)
                    .findOneByOrFail({ id: user.id })
                expect(loaded.topAvatarId).to.equal(avatar.id)
            }),
        )
    })

    it("persists a relation object assigned inside an embedded", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const avatar = await dataSource
                    .getRepository(Avatar)
                    .save(new Avatar())

                const user = new User()
                user.profile = new Profile()
                user.profile.avatar = avatar
                await dataSource.getRepository(User).save(user)

                const loaded = await dataSource
                    .getRepository(User)
                    .findOneByOrFail({ id: user.id })
                expect(loaded.profile.avatarId).to.equal(avatar.id)
            }),
        )
    })

    it("persists a relation object assigned inside an embedded on update", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const avatar = await dataSource
                    .getRepository(Avatar)
                    .save(new Avatar())

                const user = new User()
                user.profile = new Profile()
                await dataSource.getRepository(User).save(user)

                const toUpdate = await dataSource
                    .getRepository(User)
                    .findOneByOrFail({ id: user.id })
                toUpdate.profile.avatar = avatar
                await dataSource.getRepository(User).save(toUpdate)

                const loaded = await dataSource
                    .getRepository(User)
                    .findOneByOrFail({ id: user.id })
                expect(loaded.profile.avatarId).to.equal(avatar.id)
            }),
        )
    })
})
