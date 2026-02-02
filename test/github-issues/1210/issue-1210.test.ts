import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Event } from "./entity/Event"

describe("github issues > #1210 mongodb does not have multiple entities properly", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should save entities properly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const event1 = new Event()
                event1.date = new Date()
                event1.name = "Doing a lil hassle with the typeorm"

                const event2 = new Event()
                event2.date = new Date("11/06/2018")
                event2.name =
                    "Continue with the development of My Partners in Sports App"

                const event3 = new Event()
                event3.date = new Date("11/06/2018")
                event3.name =
                    "Continue with the development of My Partners in Sports App"

                const event4 = new Event()
                event4.date = new Date("11/06/2018")
                event4.name =
                    "Continue with the development of My Partners in Sports App"

                const user1 = new User()
                user1.firstName = "Vovan"
                user1.lastName = "Supa"
                user1.age = 34
                user1.events = [event1, event2]

                const user2 = new User()
                user2.firstName = "Alex1"
                user2.lastName = "Coola1"
                user2.age = 71
                user2.events = [event2, event3, event4]

                // user2.events.push(event2);
                const users = [user1, user2]
                const events = [event1, event2, event3, event4]

                await connection.mongoManager.save(events)
                await connection.mongoManager.save(users)
            }),
        ))
})
