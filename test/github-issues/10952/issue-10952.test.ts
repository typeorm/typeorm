import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Dependency } from "./entity/dependency"
import { Example } from "./entity/example"

describe("github issues > #10952 Incorrect entity identification and persistence on composite foreign primary key endo-relation entities", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("should persist composite foreign primary keyed endo-relations correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const example1 = new Example()
                example1.id = 1
                example1.name = "example1"
                await dataSource.manager.save(example1)

                const dependency = new Dependency()
                dependency.to = example1
                dependency.label = "dependency"

                const example2 = new Example()
                example2.id = 2
                example2.name = "example2"
                example2.dependencies = [dependency]
                await dataSource.manager.save(example2)

                let reloadedExample2 = await dataSource.manager.findOneByOrFail(
                    Example,
                    { id: 2 },
                )
                expect(reloadedExample2.dependencies.length).to.equal(1)
                expect(reloadedExample2.dependencies[0]).to.include({
                    fromId: 2,
                    toId: 1,
                    label: "dependency",
                })

                reloadedExample2.dependencies[0].label = "updated"
                await dataSource.manager.save(reloadedExample2)

                reloadedExample2 = await dataSource.manager.findOneByOrFail(
                    Example,
                    { id: 2 },
                )
                expect(reloadedExample2.dependencies.length).to.equal(1)
                expect(reloadedExample2.dependencies[0]).to.include({
                    fromId: 2,
                    toId: 1,
                    label: "updated",
                })

                reloadedExample2.dependencies = []
                await dataSource.manager.save(reloadedExample2)

                reloadedExample2 = await dataSource.manager.findOneByOrFail(
                    Example,
                    { id: 2 },
                )
                expect(reloadedExample2.dependencies.length).to.equal(0)
            }),
        ))
})
