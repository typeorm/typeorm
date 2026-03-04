import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Sailing } from "./entity/Sailing"
import { ScheduledSailing } from "./entity/ScheduledSailing"

describe("github issues > #8026 Inserting a value for a column that has a relation, and is also a date, results in the value being inserted as DEFAULT", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Sailing, ScheduledSailing],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    after(() => closeTestingConnections(dataSources))

    it("it should include a related date column in the constructed query", () => {
        for (const connection of dataSources) {
            const queryBuilder = connection.createQueryBuilder()

            const insertValue = {
                scheduled_departure_time: new Date(),
                scheduled_arrival_time: new Date(),
            }

            const [query, params] = queryBuilder
                .insert()
                .into(ScheduledSailing)
                .values([insertValue])
                .getQueryAndParameters()

            expect(query).not.to.contain("DEFAULT")
            expect(params).length(2)
        }
    })
})
