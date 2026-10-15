import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Message } from "./entity/Message"

describe("github issues > #9058 Object mutation when inserting an array of objects using the InsertQueryBuilder", () => {
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
