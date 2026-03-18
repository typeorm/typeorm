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
import { EventRespondRenamed } from "./entity/EventRespondRenamed"

// github issues > #11745 — leftJoinAndMapOne ignores custom select and always maps full entity
describe("query builder > joins > subquery select partial columns", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Event, EventRespond, EventRespondRenamed],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("leftJoinAndMapOne with partial .select() should only map selected columns", () =>
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
                        {},
                        EventRespond,
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent).to.not.be.null
                expect(loadedEvent!.myRespond).to.not.be.null

                // Selected columns should be present
                expect(loadedEvent!.myRespond!.id).to.equal(respond.id)
                expect(loadedEvent!.myRespond!.status).to.equal("yes")
                expect(loadedEvent!.myRespond!.eventId).to.equal(event.id)

                // Non-selected column should NOT be present
                expect(loadedEvent!.myRespond).to.not.have.property("userId")
            }),
        ))

    it("leftJoinAndMapOne with full alias .select() should return all columns", () =>
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
                        {},
                        EventRespond,
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent!.myRespond).to.not.be.undefined
                expect(loadedEvent!.myRespond!.id).to.equal(respond.id)
                expect(loadedEvent!.myRespond!.status).to.equal("no")
                expect(loadedEvent!.myRespond!.eventId).to.equal(event.id)
                expect(loadedEvent!.myRespond!.userId).to.equal(2)
            }),
        ))

    it("leftJoinAndMapOne should return null when no matching row", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const event = new Event()
                event.name = "Empty Event"
                event.description = "No responds"
                await manager.save(event)

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
                                    userId: 999,
                                }),
                        "respond",
                        "respond.eventId = event.id",
                        {},
                        EventRespond,
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent).to.not.be.null
                expect(loadedEvent!.myRespond).to.be.null
            }),
        ))

    it("leftJoinAndMapMany with partial .select() should only include selected columns in SQL", () =>
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

                // Verify raw SQL only includes selected columns
                const raw = await manager
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
                    .getRawMany()

                expect(raw.length).to.equal(2)

                for (const r of raw) {
                    // Selected columns present (aliased names)
                    expect(r).to.have.property("respond_id")
                    expect(r).to.have.property("respond_status")
                    expect(r).to.have.property("respond_eventId")
                    // Non-selected column absent from raw result
                    expect(r).to.not.have.property("respond_userId")
                }
            }),
        ))

    it("existing entity class leftJoinAndMapOne should still work", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const event = new Event()
                event.name = "Regression Check"
                event.description = "Ensure no regression"
                await manager.save(event)

                const respond = new EventRespond()
                respond.eventId = event.id
                respond.userId = 5
                respond.status = "maybe"
                await manager.save(respond)

                // Entity class direct join (not subquery) — should work as before
                const loadedEvent = await manager
                    .createQueryBuilder(Event, "event")
                    .leftJoinAndMapOne(
                        "event.myRespond",
                        EventRespond,
                        "respond",
                        "respond.eventId = event.id AND respond.userId = :userId",
                        { userId: 5 },
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent!.myRespond).to.not.be.null
                expect(loadedEvent!.myRespond!.id).to.equal(respond.id)
                expect(loadedEvent!.myRespond!.status).to.equal("maybe")
                expect(loadedEvent!.myRespond!.userId).to.equal(5)
                expect(loadedEvent!.myRespond!.eventId).to.equal(event.id)
            }),
        ))

    it("leftJoinAndMapOne should handle @Column({ name }) renamed columns correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const event = new Event()
                event.name = "Renamed Column Test"
                event.description = "Test renamed DB columns"
                await manager.save(event)

                const respond = new EventRespondRenamed()
                respond.eventId = event.id
                respond.userId = 10
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
                                .from(EventRespondRenamed, "respond")
                                .where("respond.userId = :userId", {
                                    userId: 10,
                                }),
                        "respond",
                        "respond.eventId = event.id",
                        {},
                        EventRespondRenamed,
                    )
                    .where("event.id = :eventId", { eventId: event.id })
                    .getOne()

                expect(loadedEvent).to.not.be.null
                expect(loadedEvent!.myRespond).to.not.be.null

                // Selected columns present
                expect(loadedEvent!.myRespond).to.have.property("id")
                expect(loadedEvent!.myRespond).to.have.property("status")
                expect(loadedEvent!.myRespond).to.have.property("eventId")
                expect(loadedEvent!.myRespond!.status).to.equal("yes")

                // Non-selected column absent
                expect(loadedEvent!.myRespond).to.not.have.property("userId")
            }),
        ))
})
