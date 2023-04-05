import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { SelectQueryBuilder } from "../../../src/index"
import { QueryExpressionMap } from "../../../src/query-builder/QueryExpressionMap"

describe("benchmark > bulk-sql-build", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
        })
        console.log(SelectQueryBuilder)
        console.log(QueryExpressionMap)
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("testing bulk create of 10.000 sql with joins", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                for (let i = 0; i < 10_000; i++) {
                    // dataSource.getRepository(Post).createQueryBuilder("post")
                    // new SelectQueryBuilder(dataSource, undefined)
                    dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post") // +35ms
                        .leftJoinAndSelect("post.categories", "categories1") // +105ms
                        .leftJoinAndSelect("post.categories", "categories2") // +175ms
                        .leftJoinAndSelect("post.categories", "categories3") // +235ms
                        .leftJoinAndSelect("post.categories", "categories4") // +275ms
                        .leftJoinAndSelect("post.categories", "categories5") // +335ms
                        .leftJoinAndSelect("post.categories", "categories6") // +395ms
                        .leftJoinAndSelect("post.categories", "categories7") // +460ms
                        .where("post.id = 1")
                        .getQuery()
                    // expect(sql).not.to.be.empty
                }
            }),
        ))

    /**
     * Before optimization
     *
     * 100_000 -> 1.300
     *
     * √ testing bulk create of 10.000 sql with joins (2686ms)
     * √ testing bulk create of 10.000 sql with joins (1579ms)
     * √ testing bulk create of 10.000 sql with joins (1664ms)
     * √ testing bulk create of 10.000 sql with joins (1426ms)
     * √ testing bulk create of 10.000 sql with joins (1512ms)
     * √ testing bulk create of 10.000 sql with joins (1526ms)
     * √ testing bulk create of 10.000 sql with joins (1605ms)
     * √ testing bulk create of 10.000 sql with joins (1914ms)
     * √ testing bulk create of 10.000 sql with joins (1983ms)
     * √ testing bulk create of 10.000 sql with joins (1500ms)
     */
})
