import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"
import { MockSubscriber } from "./subscribers/MockSubscriber"
import "reflect-metadata"
import { User } from "./entity/User"
import { Setting } from "./entity/Setting"
import { DataSource } from "../../../src/data-source/DataSource"

describe("github issues > #6573 bugfix-missing-entity-data-in-before-remove", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [User, Setting],
                subscribers: [MockSubscriber],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    after(() => closeTestingConnections(connections))

    function insertTestData(connection: DataSource) {
        const userRepo = connection.getRepository(User)
        // const settingRepo = connection.getRepository(Setting);

        const user = new User(1, "FooGuy")
        const settingA = new Setting(1, "A", "foo")
        const settingB = new Setting(1, "B", "")
        user.settings = [settingA, settingB]

        return userRepo.save(user)
    }

    it("entity data (partial) should be available when related items are being deleted", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertTestData(connection)
                const userRepo = connection.getRepository(User)
                const subscriber = connection.subscribers[0] as MockSubscriber
                subscriber.clear()

                // resave with empty settings list, relation is configurated to delete them in this case
                await userRepo.save([
                    {
                        id: 1,
                        settings: [],
                    },
                ])

                expect(subscriber.calledData).to.be.eql([
                    { assetId: 1, name: "A" },
                    { assetId: 1, name: "B" },
                ])
            }),
        ))
})
