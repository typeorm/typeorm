import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Test } from "./entity/Test"

describe("github issues > #3913 Cannot set embedded entity to null", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                cache: {
                    alwaysEnabled: true,
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should set all embedded columns to null when entity is set to null", () =>
        Promise.all(
            connections.map(async (connection) => {
                const qb = connection.createQueryBuilder(Test, "s")
                const t = new Test()

                t.embedded = { a: "a", b: "b", nested: { c: "c" } }
                const { id } = await connection.manager.save(t)
                const t1 = await qb.getOne()
                expect(t1!.embedded).to.deep.equal({
                    a: "a",
                    b: "b",
                    nested: { c: "c" },
                })

                t!.embedded = null
                t!.id = id
                await connection.manager.save(t)
                const t2 = await connection
                    .createQueryBuilder(Test, "s")
                    .getOne()
                expect(t2!.embedded).to.equal(null)

                await qb
                    .update()
                    .set({ embedded: { a: "a", b: null } })
                    .execute()
                const t3 = await qb.getOne()
                expect(t3!.embedded).to.deep.equal({
                    a: "a",
                    b: null,
                    nested: null,
                })

                await qb.update().set({ embedded: null }).execute()
                const t4 = await qb.getOne()
                expect(t4!.embedded).to.equal(null)
            }),
        ))
})
