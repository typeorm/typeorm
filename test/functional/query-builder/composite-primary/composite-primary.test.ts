import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src"
import { Foo } from "./entity/Foo"
import { Bar } from "./entity/Bar"
import { expect } from "chai"

describe("query builder > composite primary", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Foo, Bar],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should find entity by another entity with a composite key", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const foo = new Foo()
                foo.id1 = 1
                foo.id2 = 2
                await connection.manager.save(foo)

                const bar = new Bar()
                bar.id = 1
                bar.foo = foo
                await connection.manager.save(bar)

                const loadedBar = await connection.manager
                    .getRepository(Bar)
                    .findOne({
                        where: {
                            foo,
                        },
                    })

                expect(loadedBar!.id).to.be.equal(bar.id)
            }),
        ))
})
