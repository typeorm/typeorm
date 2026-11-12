import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Message } from "./entity/Message"
import { Reading } from "./entity/Reading"

describe("query builder > insert > re-selected values", () => {
    describe("rows returned in another order", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Message],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        // ids are listed in the reverse of their sort order, so a database that
        // returns the re-selected rows in primary key order hands them back in a
        // different order than the inserted values
        const createValues = () => [
            { id: "c", text: "text of c" },
            { id: "b", text: "text of b" },
            { id: "a", text: "text of a" },
        ]

        // GitHub issue #9058
        it("should not mix up the values of the inserted objects", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const values = createValues()

                    const result = await dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(Message)
                        .values(values)
                        .execute()

                    expect(values).to.deep.equal(createValues())
                    expect(result.identifiers).to.deep.equal([
                        { id: "c" },
                        { id: "b" },
                        { id: "a" },
                    ])

                    const messages = await dataSource
                        .getRepository(Message)
                        .find({ order: { id: "ASC" } })
                    expect(messages).to.deep.equal([
                        { id: "a", text: "text of a" },
                        { id: "b", text: "text of b" },
                        { id: "c", text: "text of c" },
                    ])
                }),
            ))
    })

    describe("ids hydrated with another type", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Reading],
                enabledDrivers: ["mysql", "mariadb"],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should merge the re-selected values into the inserted objects", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const readings: Partial<Reading>[] = [
                        { day: new Date(2024, 0, 2) },
                        { day: new Date(2024, 0, 1) },
                    ]

                    const result = await dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(Reading)
                        .values(readings)
                        .execute()

                    expect(
                        readings.map((reading) => reading.text),
                    ).to.deep.equal(["none", "none"])
                    expect(
                        result.generatedMaps.map(
                            (generatedMap) => generatedMap.text,
                        ),
                    ).to.deep.equal(["none", "none"])
                }),
            ))
    })
})
