import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Event } from "./entity/Event"
import { EventRespond } from "./entity/EventRespond"

describe("query builder > joins > subquery select partial columns", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Event, EventRespond],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("leftJoinAndMapOne should only return selected columns from subquery", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const event = new Event()
                event.name = "Tech Conference"
                event.description = "Annual tech conference"
                await manager.save(event)

                const respond = new EventRespond()
                respond.eventId = event.id
                respond.userId = 1
                respond.status = "yes"
                await manager.save(respond)

                const loadedEvent = await manager
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
                        "respond.eventId = event.id",
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent).to.not.be.null
                expect(loadedEvent!.myRespond).to.not.be.undefined
                expect(loadedEvent!.myRespond).to.not.be.null

                // Selected columns should be present
                expect(loadedEvent!.myRespond).to.have.property("id")
                expect(loadedEvent!.myRespond).to.have.property("status")
                expect(loadedEvent!.myRespond).to.have.property("eventId")
                expect(loadedEvent!.myRespond.status).to.equal("yes")

                // Non-selected column should NOT be present
                expect(loadedEvent!.myRespond).to.not.have.property("userId")
            }),
        ))

    it("leftJoinAndMapOne should return all columns when selecting entire alias", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const event = new Event()
                event.name = "Workshop"
                event.description = "Developer workshop"
                await manager.save(event)

                const respond = new EventRespond()
                respond.eventId = event.id
                respond.userId = 2
                respond.status = "no"
                await manager.save(respond)

                const loadedEvent = await manager
                    .createQueryBuilder(Event, "event")
                    .leftJoinAndMapOne(
                        "event.myRespond",
                        (qb) =>
                            qb
                                .select("respond")
                                .from(EventRespond, "respond")
                                .where("respond.userId = :userId", {
                                    userId: 2,
                                }),
                        "respond",
                        "respond.eventId = event.id",
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent!.myRespond).to.not.be.undefined
                expect(loadedEvent!.myRespond).to.have.property("id")
                expect(loadedEvent!.myRespond).to.have.property("status")
                expect(loadedEvent!.myRespond).to.have.property("eventId")
                expect(loadedEvent!.myRespond).to.have.property("userId")
            }),
        ))

    it("leftJoinAndMapOne should return all columns when no select specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const event = new Event()
                event.name = "Meetup"
                event.description = "Monthly meetup"
                await manager.save(event)

                const respond = new EventRespond()
                respond.eventId = event.id
                respond.userId = 3
                respond.status = "maybe"
                await manager.save(respond)

                const loadedEvent = await manager
                    .createQueryBuilder(Event, "event")
                    .leftJoinAndMapOne(
                        "event.myRespond",
                        (qb) =>
                            qb
                                .select("respond")
                                .from(EventRespond, "respond")
                                .where("respond.userId = :userId", {
                                    userId: 3,
                                }),
                        "respond",
                        "respond.eventId = event.id",
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent!.myRespond).to.not.be.undefined
                expect(loadedEvent!.myRespond).to.have.property("id")
                expect(loadedEvent!.myRespond).to.have.property("status")
                expect(loadedEvent!.myRespond).to.have.property("eventId")
                expect(loadedEvent!.myRespond).to.have.property("userId")
            }),
        ))

    it("leftJoinAndMapMany should only return selected columns from subquery", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const event = new Event()
                event.name = "Conference"
                event.description = "Big conference"
                await manager.save(event)

                const respond1 = new EventRespond()
                respond1.eventId = event.id
                respond1.userId = 1
                respond1.status = "yes"
                await manager.save(respond1)

                const respond2 = new EventRespond()
                respond2.eventId = event.id
                respond2.userId = 2
                respond2.status = "no"
                await manager.save(respond2)

                const loadedEvent = await manager
                    .createQueryBuilder(Event, "event")
                    .leftJoinAndMapMany(
                        "event.myResponds",
                        (qb) =>
                            qb
                                .select([
                                    "respond.id",
                                    "respond.status",
                                    "respond.eventId",
                                ])
                                .from(EventRespond, "respond"),
                        "respond",
                        "respond.eventId = event.id",
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent!.myResponds).to.not.be.undefined
                expect(loadedEvent!.myResponds.length).to.equal(2)

                for (const r of loadedEvent!.myResponds) {
                    expect(r).to.have.property("id")
                    expect(r).to.have.property("status")
                    expect(r).to.have.property("eventId")
                    expect(r).to.not.have.property("userId")
                }
            }),
        ))
})
