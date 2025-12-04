import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

import { Embedded } from "./entity/Embedded"
import { User } from "./entity/User"

describe("github issues > #6977 Relation columns in embedded entities are not prefixed", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [User, Embedded],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly assign foreign key columns in embedded entity", () => {
        connections.forEach((connection) => {
            const columnNames = connection.entityMetadatas
                .find((entity) => entity.name === "User")!
                .columns.map((column) => column.databaseName)
                .sort()
            expect(columnNames).to.deep.equal([
                "embeddedRelationuser1id",
                "embeddedRelationuser2id",
                "id",
            ])
        })
    })
})
