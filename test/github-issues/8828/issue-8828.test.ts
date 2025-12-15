import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ExampleEntity } from "./entity/ExampleEntity"
import { expect } from "chai"

describe("github issues > #8828 Widen query parameters type to support named placeholders?", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [ExampleEntity],
            enabledDrivers: ["mysql"],
            driverSpecific: {
                extra: {
                    namedPlaceholders: true,
                },
            },
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("can use named parameters in a sql query", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const foo = new ExampleEntity()
                foo.name = "foo"
                await dataSource.manager.save(foo)

                const bar = new ExampleEntity()
                bar.name = "bar"
                await dataSource.manager.save(bar)

                const examples = await dataSource.manager.query(
                    `SELECT * FROM example_entity WHERE name = :name`,
                    { name: "bar" },
                )

                expect(examples[0].name).to.equal("bar")
            }),
        )
    })
})
