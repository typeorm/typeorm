import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { expect } from "chai"

describe("table-inheritance > class-table > discriminator-collision", () => {
    let connections: DataSource[]
    let connectionError: Error | undefined

    before(async () => {
        try {
            connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })
        } catch (error) {
            connectionError = error as Error
            connections = []
        }
    })
    beforeEach(async () => {
        if (connections.length > 0) {
            await reloadTestingDatabases(connections)
        }
    })
    after(async () => {
        if (connections.length > 0) {
            await closeTestingConnections(connections)
        }
    })

    it("should handle child defining a column with same name as parent discriminator", () => {
        // This test documents the behavior when a CTI child defines a column
        // that collides with the parent's discriminator column name.
        // In CTI, discriminator is on the parent table and child columns are on
        // the child table, so they don't collide physically.
        // The collision happens at the property level during hydration:
        // the discriminator value from the parent table takes precedence.

        if (connectionError) {
            throw new Error(
                `Connection setup failed due to column name collision: ${connectionError.message}`,
            )
        }

        return Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.type = "admin" // child's own type column

                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Alice")
                expect(loaded!.email).to.equal("alice@example.com")
                // The discriminator value ("User") takes precedence over
                // the child's own "type" column value during hydration
                expect(loaded!.type).to.equal("User")
            }),
        )
    })
})
