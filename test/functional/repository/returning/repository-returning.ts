import { expect } from "chai"
import "reflect-metadata"

import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { User } from "./entity/User"

describe("repository > returning", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres", "mysql", "mssql", "spanner"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("allows specifying RETURNING via repository.update options", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!connection.driver.isReturningSqlSupported("update")) {
                    return
                }

                const repo = connection.getRepository(User)
                const created = await repo.save({ name: "before" })

                const result = await repo.update(
                    created.id,
                    { name: "after" },
                    { returning: ["id", "name"] },
                )

                expect(result.raw).to.be.an("array")
                expect(result.raw[0]).to.include({
                    id: created.id,
                    name: "after",
                })
            }),
        ))

    it("allows specifying RETURNING via repository.upsert options", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!connection.driver.isReturningSqlSupported("insert")) {
                    return
                }

                const repo = connection.getRepository(User)
                const created = await repo.save({ name: "seed" })

                const result = await repo.upsert(
                    { id: created.id, name: "seed-updated" },
                    {
                        conflictPaths: ["id"],
                        returning: ["id", "name"],
                    },
                )

                expect(result.raw).to.be.an("array")
                expect(result.raw[0]).to.include({
                    id: created.id,
                    name: "seed-updated",
                })
            }),
        ))
})
