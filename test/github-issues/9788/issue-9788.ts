import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ExampleCentityFirst, ExampleDentityFirst } from "./entity"

describe("github issues > #9788 🐛 BUG: Wrong resolution of referencedColumn", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not throw error when loading entities with relations using EntityManager", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(ExampleCentityFirst)
                    .find({ relations: { aToC: true, bToD: true } })

                await dataSource
                    .getRepository(ExampleDentityFirst)
                    .find({ relations: { aToC: true, bToD: true } })
            }),
        ))

    it("should have correct and same query with relations using QueryBuilder", async () =>
        Promise.all(
            dataSources
                .filter((d) => d.options.type !== "mongodb")
                .map(async (dataSource) => {
                    const queryBuilderCentityFirst = dataSource
                        .createQueryBuilder(ExampleCentityFirst, "Example")
                        .leftJoinAndSelect(
                            "Example.aToC",
                            "Example__Example_aToC",
                        )
                        .leftJoinAndSelect(
                            "Example.bToD",
                            "Example__Example_bToD",
                        )
                        .select()

                    await queryBuilderCentityFirst.getMany()
                    await queryBuilderCentityFirst.getRawMany()

                    const queryBuilderDentityFirst = dataSource
                        .createQueryBuilder(ExampleDentityFirst, "Example")
                        .leftJoinAndSelect(
                            "Example.aToC",
                            "Example__Example_aToC",
                        )
                        .leftJoinAndSelect(
                            "Example.bToD",
                            "Example__Example_bToD",
                        )
                        .select()

                    await queryBuilderDentityFirst.getMany()
                    await queryBuilderDentityFirst.getRawMany()

                    queryBuilderCentityFirst
                        .getQuery()
                        .should.be.equal(queryBuilderDentityFirst.getQuery())
                }),
        ))
})
