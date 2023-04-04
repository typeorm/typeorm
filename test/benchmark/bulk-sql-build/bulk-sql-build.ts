import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { SelectQueryBuilder } from "../../../src/index"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("benchmark > bulk-sql-build", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                __dirname,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("testing bulk create of 10.000 sql with joins", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                for (let i = 0; i < 100_000; i++) {
                    // dataSource.getRepository(Post).createQueryBuilder("post")
                    // new SelectQueryBuilder(dataSource, undefined)
                    // const alias = DriverUtils.buildAlias(
                    //     dataSource.driver,
                    //     "post",
                    // )
                    const metadata = dataSource.getMetadata(Post)
                    // new SelectQueryBuilder(dataSource, undefined).select(alias)
                    // .from(metadata.target, alias)
                    // .leftJoinAndSelect("post.categories", "categories")
                    // .where("post.id = 1")
                    // .getQuery()
                    // expect(sql).not.to.be.empty
                }
            }),
        ))

    /**
     * Before optimization
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
