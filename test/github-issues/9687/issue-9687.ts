import { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { Foo } from "./entity/Foo"

describe("github issues > #9687 protect type for a default function in Column", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: ["oracle"],
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should have default value column correctly", () => {
        Promise.all(
            connections.map(async (connection) => {
                const fooRepository = connection.getTreeRepository(Foo)

                const foo = new Foo()
                await fooRepository.save(foo)

                const savedFoo = await fooRepository.findOneBy({ id: foo.id })
                if (!savedFoo) {
                    throw new Error("foo not found")
                }

                savedFoo.should.be.instanceOf(Foo)
                savedFoo.string.should.be.equal("string")
                savedFoo.number.should.be.equal(1)
                savedFoo.boolean.should.be.equal(true)
                savedFoo.date.should.be.instanceOf(Date)
                savedFoo.functionString.should.be.equal("function")
            }),
        )
    })
})
