import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../src"
import { QueryFailedError } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Example } from "./entity/Example"
import { QueryEventSubscriber } from "./subscribers/QueryEventSubscriber"

describe("entity subscriber > query events", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["mongodb", "spanner"],
            entities: [Example],
            subscribers: [QueryEventSubscriber],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should wait for an async afterQuery subscriber before resolving", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const subscriber = dataSource
                    .subscribers[0] as QueryEventSubscriber
                subscriber.clearOutcomes()

                await dataSource.manager.find(Example)

                expect(subscriber.pending).to.equal(0)
                expect(subscriber.outcomes).to.include(true)
            }),
        ))

    it("should wait for an async afterQuery subscriber before rejecting", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const subscriber = dataSource
                    .subscribers[0] as QueryEventSubscriber
                subscriber.clearOutcomes()

                await expectQueryToFail(dataSource)

                expect(subscriber.pending).to.equal(0)
            }),
        ))

    it("should broadcast afterQuery with success false when the query fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const subscriber = dataSource
                    .subscribers[0] as QueryEventSubscriber
                subscriber.clearOutcomes()

                await expectQueryToFail(dataSource)

                expect(subscriber.outcomes).to.include(false)
            }),
        ))

    it("should wrap a failing query in QueryFailedError", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const error = await expectQueryToFail(dataSource)

                expect(error).to.be.instanceOf(QueryFailedError)
            }),
        ))
})

/**
 * Runs a statement no supported dialect can parse and returns the rejection.
 */
async function expectQueryToFail(dataSource: DataSource): Promise<unknown> {
    try {
        await dataSource.query("SELCT 1")
    } catch (error) {
        return error
    }

    throw new Error(
        `Expected the query to fail on ${dataSource.options.type} but it succeeded`,
    )
}
