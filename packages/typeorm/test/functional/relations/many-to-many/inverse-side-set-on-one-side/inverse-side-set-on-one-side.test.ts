import { expect } from "chai"
import "reflect-metadata"

import { EntitySchema } from "../../../../../src"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

interface Event {
    id: number
    name: string
    pledges: Pledge[]
}

interface Pledge {
    id: number
    amount: number
    events: Event[]
}

function createSchemas(
    eventInverseSide: string | undefined,
    pledgeInverseSide: string | undefined,
) {
    const EventSchema = new EntitySchema<Event>({
        name: "Event",
        columns: {
            id: { type: Number, primary: true },
            name: { type: String },
        },
        relations: {
            pledges: {
                target: "Pledge",
                type: "many-to-many",
                inverseSide: eventInverseSide,
                joinTable: {
                    name: "event_pledge",
                    joinColumn: {
                        name: "event_id",
                        referencedColumnName: "id",
                    },
                    inverseJoinColumn: {
                        name: "pledge_id",
                        referencedColumnName: "id",
                    },
                },
            },
        },
    })

    const PledgeSchema = new EntitySchema<Pledge>({
        name: "Pledge",
        columns: {
            id: { type: Number, primary: true },
            amount: { type: Number },
        },
        relations: {
            events: {
                target: "Event",
                cascade: true,
                type: "many-to-many",
                inverseSide: pledgeInverseSide,
            },
        },
    })

    return { EventSchema, PledgeSchema }
}

describe("relations > many-to-many > inverse side set on one side", () => {
    // GitHub issue #11500 - many-to-many could not be joined from the side without the join table
    const cases: {
        title: string
        eventInverseSide: string | undefined
        pledgeInverseSide: string | undefined
    }[] = [
        {
            title: "inverse side set on both sides",
            eventInverseSide: "events",
            pledgeInverseSide: "pledges",
        },
        {
            title: "inverse side set only on the side without the join table",
            eventInverseSide: undefined,
            pledgeInverseSide: "pledges",
        },
        {
            title: "inverse side set only on the side with the join table",
            eventInverseSide: "events",
            pledgeInverseSide: undefined,
        },
        {
            title: "inverse side of the join table side naming a missing property",
            eventInverseSide: "event",
            pledgeInverseSide: "pledges",
        },
    ]

    for (const { title, eventInverseSide, pledgeInverseSide } of cases) {
        describe(title, () => {
            const { EventSchema, PledgeSchema } = createSchemas(
                eventInverseSide,
                pledgeInverseSide,
            )

            let dataSources: DataSource[]
            before(async () => {
                dataSources = await createTestingConnections({
                    entities: [EventSchema, PledgeSchema],
                    schemaCreate: true,
                    dropSchema: true,
                })
            })
            beforeEach(() => reloadTestingDatabases(dataSources))
            after(() => closeTestingConnections(dataSources))

            async function prepareData(dataSource: DataSource) {
                const event = await dataSource
                    .getRepository(EventSchema)
                    .save({ id: 1, name: "Gala" })
                await dataSource
                    .getRepository(EventSchema)
                    .save({ id: 2, name: "Run" })
                await dataSource
                    .getRepository(PledgeSchema)
                    .save({ id: 1, amount: 50, events: [event] })
                await dataSource
                    .getRepository(PledgeSchema)
                    .save({ id: 2, amount: 20, events: [] })
            }

            it("should join from the side with the join table", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const events = await dataSource
                            .getRepository(EventSchema)
                            .createQueryBuilder("event")
                            .innerJoin("event.pledges", "pledges")
                            .where("pledges.id = :pledgeId", { pledgeId: 1 })
                            .getMany()

                        expect(events.map((event) => event.id)).to.eql([1])
                    }),
                ))

            it("should join from the side without the join table", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const pledges = await dataSource
                            .getRepository(PledgeSchema)
                            .createQueryBuilder("pledge")
                            .innerJoin("pledge.events", "events")
                            .where("events.id = :eventId", { eventId: 1 })
                            .getMany()

                        expect(pledges.map((pledge) => pledge.id)).to.eql([1])
                    }),
                ))

            it("should load the relation from the side without the join table", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const pledges = await dataSource
                            .getRepository(PledgeSchema)
                            .find({
                                relations: { events: true },
                                order: { id: "ASC" },
                            })

                        expect(
                            pledges.map((pledge) =>
                                pledge.events.map((event) => event.id),
                            ),
                        ).to.eql([[1], []])
                    }),
                ))
        })
    }
})
