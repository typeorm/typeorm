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
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Foo } from "./entity/Foo"
import { Bar } from "./entity/Bar"

describe("github issues > #4060 Fail to insert entity with Buffer type of primary column under some circumstances.", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mysql", "mariadb"],
            entities: [Foo, Bar],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should save entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                const id = Buffer.from("foobar")
                const foo = new Foo()
                foo.id = id
                foo.name = "foo"
                await connection.manager.save(foo)

                const bar = new Bar()
                bar.id = id
                bar.name = "bar"
                await connection.manager.save(bar)

                expect(foo).to.exist
                expect(bar).to.exist
            }),
        ))
})
