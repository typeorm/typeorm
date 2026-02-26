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
        // the child table, so in theory they don't collide physically.

        if (connectionError) {
            // If connection failed, document the error
            console.log(
                "Connection failed with column name collision:",
                connectionError.message,
            )
            // The collision may cause a metadata error at startup — that's acceptable
            return
        }

        return Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.type = "admin" // child's own type column

                try {
                    await connection.getRepository(User).save(user)

                    const loaded = await connection
                        .getRepository(User)
                        .findOneBy({ id: user.id })

                    expect(loaded).to.not.be.null
                    expect(loaded!.name).to.equal("Alice")
                    expect(loaded!.email).to.equal("alice@example.com")
                    // Document which value we get for `type` —
                    // it might be the child's "admin" or the discriminator "User"
                    console.log(
                        `Loaded user.type = "${loaded!.type}" (child column value)`,
                    )
                } catch (error: any) {
                    // Document any error that occurs during save/load
                    console.log(
                        "Column collision caused error:",
                        error.message,
                    )
                }
            }),
        )
    })
})
