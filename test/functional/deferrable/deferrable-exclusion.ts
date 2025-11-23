import "reflect-metadata"
import { expect } from "chai"

import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

import { Booking } from "./entity/Booking"
import { Schedule } from "./entity/Schedule"

describe("deferrable exclusion constraints", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("initially deferred exclusion should be validated at the end of transaction", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.transaction(async (manager) => {
                    // first save booking
                    const booking1 = new Booking()
                    booking1.id = 1
                    booking1.from = new Date("2024-01-01")
                    booking1.to = new Date("2024-01-10")

                    await manager.save(booking1)

                    // then save booking with exclusion violation
                    const booking2 = new Booking()
                    booking2.id = 2
                    booking2.from = new Date("2024-01-05")
                    booking2.to = new Date("2024-01-15")

                    await manager.save(booking2)

                    // Fix overlap before commit
                    booking2.from = new Date("2024-01-11")

                    await manager.save(booking2)
                })

                // now check
                const bookings = await connection.manager.find(Booking, {
                    order: { id: "ASC" },
                })

                expect(bookings).to.have.length(2)

                bookings[0].should.be.eql({
                    id: 1,
                    from: new Date("2024-01-01"),
                    to: new Date("2024-01-10"),
                })
                bookings[1].should.be.eql({
                    id: 2,
                    from: new Date("2024-01-11"),
                    to: new Date("2024-01-15"),
                })
            }),
        ))

    it("initially immediate exclusion should be validated at the end at transaction with deferred check time", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.transaction(async (manager) => {
                    // first set constraints deferred manually
                    await manager.query("SET CONSTRAINTS ALL DEFERRED")

                    // first save schedule
                    const schedule1 = new Schedule()
                    schedule1.start = new Date("2024-02-01")
                    schedule1.end = new Date("2024-02-10")

                    await manager.save(schedule1)

                    // then save schedule with exclusion violation
                    const schedule2 = new Schedule()
                    schedule2.start = new Date("2024-02-05")
                    schedule2.end = new Date("2024-02-15")

                    await manager.save(schedule2)

                    // Fix overlap before commit
                    schedule1.end = new Date("2024-02-04")

                    await manager.save(schedule1)
                })

                // now check
                const schedules = await connection.manager.find(Schedule, {
                    order: { id: "ASC" },
                })

                expect(schedules).to.have.length(2)

                schedules[0].should.be.eql({
                    id: schedules[0].id,
                    start: new Date("2024-02-01"),
                    end: new Date("2024-02-04"),
                })
                schedules[1].should.be.eql({
                    id: schedules[1].id,
                    start: new Date("2024-02-05"),
                    end: new Date("2024-02-15"),
                })
            }),
        ))
})
