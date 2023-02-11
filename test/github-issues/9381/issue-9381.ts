import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource, In, Not } from "../../../src"
import { ExampleEntity } from "./entity/ExampleEntity"
import { expect } from "chai"

describe("github issues > #9381 The column option 《transformer》 affects the result of the query condition generation", () => {
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

    it("transform and find values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let repository = dataSource.getRepository(ExampleEntity)
                await repository.save(new ExampleEntity())
                await repository.save(new ExampleEntity())
                await repository.save(new ExampleEntity())
                await repository.save(new ExampleEntity())
                await repository.save(new ExampleEntity())
                const resultFindAll = await repository.find()
                expect(resultFindAll.length).to.be.eql(5)

                const resultTransformer = await repository.findBy({
                    id: Not(In(["1", "3", "5"])),
                })
                expect(resultTransformer).to.be.eql([{ id: "2" }, { id: "4" }])

                const findEqualsTransformer = await repository.findOne({
                    where: {
                        id: "1",
                    },
                })
                expect(findEqualsTransformer).to.be.eql({ id: "1" })
            }),
        ))

    // you can add additional tests if needed
})
