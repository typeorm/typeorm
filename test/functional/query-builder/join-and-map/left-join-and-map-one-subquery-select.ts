import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Event } from "./entity/Event"
import { EventRespond } from "./entity/EventRespond"

describe("query builder > join-and-map > leftJoinAndMapOne with subquery select", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    describe("leftJoinAndMapOne", () => {
        it("should respect subquery select and only map selected columns (Issue #11745)", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Setup test data
                    const event = new Event()
                    event.name = "Tech Conference 2024"
                    event.description = "Annual tech conference"
                    await connection.manager.save(event)

                    const respond = new EventRespond()
                    respond.eventId = event.id
                    respond.userId = 1
                    respond.status = "no"
                    await connection.manager.save(respond)

                    // Execute query with subquery that selects only specific columns
                    const loadedEvent = await connection.manager
                        .createQueryBuilder(Event, "event")
                        .leftJoinAndMapOne(
                            "event.myRespond",
                            (qb) =>
                                qb
                                    .select([
                                        "respond.id",
                                        "respond.status",
                                        "respond.eventId",
                                    ])
                                    .from(EventRespond, "respond")
                                    .where("respond.userId = :userId", {
                                        userId: 1,
                                    }),
                            "respond",
                            "respond.respond_eventId = event.id",
                        )
                        .where("event.id = :eventId", { eventId: event.id })
                        .getOne()

                    // Verify the event was loaded
                    expect(loadedEvent).to.not.be.null
                    expect(loadedEvent!.id).to.equal(event.id)
                    expect(loadedEvent!.name).to.equal("Tech Conference 2024")

                    // Verify mapped respond object exists
                    expect(loadedEvent!.myRespond).to.not.be.undefined
                    expect(loadedEvent!.myRespond).to.not.be.null

                    //  EXPECTED BEHAVIOR: Only selected columns (id, status, eventId) should be present
                    expect(loadedEvent!.myRespond).to.have.property("id")
                    expect(loadedEvent!.myRespond).to.have.property("status")
                    expect(loadedEvent!.myRespond).to.have.property("eventId")
                    expect(loadedEvent!.myRespond.id).to.equal(respond.id)
                    expect(loadedEvent!.myRespond.status).to.equal("no")
                    expect(loadedEvent!.myRespond.eventId).to.equal(event.id)

                    //  CURRENT BUG: This property should NOT be present
                    // because it was not selected in the subquery
                    expect(loadedEvent!.myRespond).to.not.have.property(
                        "userId",
                    )
                }),
            ))

        it("should map all columns when subquery selects entire alias", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Setup test data
                    const event = new Event()
                    event.name = "Workshop 2024"
                    event.description = "Developer workshop"
                    await connection.manager.save(event)

                    const respond = new EventRespond()
                    respond.eventId = event.id
                    respond.userId = 2
                    respond.status = "yes"
                    await connection.manager.save(respond)

                    // Execute query with subquery that selects entire alias
                    const loadedEvent = await connection.manager
                        .createQueryBuilder(Event, "event")
                        .leftJoinAndMapOne(
                            "event.myRespond",
                            (qb) =>
                                qb
                                    .select("respond") // Select entire entity
                                    .from(EventRespond, "respond")
                                    .where("respond.userId = :userId", {
                                        userId: 2,
                                    }),
                            "respond",
                            "respond.respond_eventId = event.id",
                        )
                        .where("event.id = :eventId", { eventId: event.id })
                        .getOne()

                    // Verify all columns are present when entire alias is selected
                    expect(loadedEvent!.myRespond).to.not.be.undefined
                    expect(loadedEvent!.myRespond).to.have.property("id")
                    expect(loadedEvent!.myRespond).to.have.property("status")
                    expect(loadedEvent!.myRespond).to.have.property("eventId")
                    expect(loadedEvent!.myRespond).to.have.property("userId")
                }),
            ))

        it("should handle multiple partial selects in subquery", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Setup test data
                    const event = new Event()
                    event.name = "Meetup 2024"
                    event.description = "Monthly meetup"
                    await connection.manager.save(event)

                    const respond = new EventRespond()
                    respond.eventId = event.id
                    respond.userId = 3
                    respond.status = "maybe"
                    await connection.manager.save(respond)

                    // Execute query selecting only id and eventId (for join)
                    const loadedEvent = await connection.manager
                        .createQueryBuilder(Event, "event")
                        .leftJoinAndMapOne(
                            "event.myRespond",
                            (qb) =>
                                qb
                                    .select(["respond.id", "respond.eventId"])
                                    .from(EventRespond, "respond")
                                    .where("respond.userId = :userId", {
                                        userId: 3,
                                    }),
                            "respond",
                            "respond.respond_eventId = event.id",
                        )
                        .where("event.id = :eventId", { eventId: event.id })
                        .getOne()

                    // Only id and eventId should be present
                    expect(loadedEvent!.myRespond).to.not.be.undefined
                    expect(loadedEvent!.myRespond).to.have.property("id")
                    expect(loadedEvent!.myRespond).to.have.property("eventId")
                    expect(loadedEvent!.myRespond).to.not.have.property(
                        "status",
                    )
                    expect(loadedEvent!.myRespond).to.not.have.property(
                        "userId",
                    )
                }),
            ))

        it("should preserve nested property paths in subquery select", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Setup test data
                    const event = new Event()
                    event.name = "Networking Event 2024"
                    event.description = "Professional networking"
                    await connection.manager.save(event)

                    const respond = new EventRespond()
                    respond.eventId = event.id
                    respond.userId = 4
                    respond.status = "yes"
                    respond.contact = {
                        email: "test@example.com",
                        phone: "123-456-7890",
                    }
                    await connection.manager.save(respond)

                    // Execute query selecting nested property
                    const loadedEvent = await connection.manager
                        .createQueryBuilder(Event, "event")
                        .leftJoinAndMapOne(
                            "event.myRespond",
                            (qb) =>
                                qb
                                    .select([
                                        "respond.id",
                                        "respond.eventId",
                                        "respond.contact.email",
                                    ])
                                    .from(EventRespond, "respond")
                                    .where("respond.userId = :userId", {
                                        userId: 4,
                                    }),
                            "respond",
                            "respond.respond_eventId = event.id",
                        )
                        .where("event.id = :eventId", { eventId: event.id })
                        .getOne()

                    // Verify nested property path is preserved
                    expect(loadedEvent!.myRespond).to.not.be.undefined
                    expect(loadedEvent!.myRespond).to.have.property("id")
                    expect(loadedEvent!.myRespond).to.have.property("eventId")
                    expect(loadedEvent!.myRespond).to.have.property("contact")
                    expect(loadedEvent!.myRespond.contact).to.have.property(
                        "email",
                    )
                    expect(loadedEvent!.myRespond.contact.email).to.equal(
                        "test@example.com",
                    )
                    // phone should not be present (not selected)
                    expect(loadedEvent!.myRespond.contact).to.not.have.property(
                        "phone",
                    )
                    // Other properties should not be present
                    expect(loadedEvent!.myRespond).to.not.have.property(
                        "status",
                    )
                    expect(loadedEvent!.myRespond).to.not.have.property(
                        "userId",
                    )
                }),
            ))
    })
})
