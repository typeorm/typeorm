import "reflect-metadata"
import { expect } from "chai"
import { And, DataSource, Equal, ILike, Like, Not } from "../../../../src"
import type { FindOptionsWhere } from "../../../../src"
import {
    closeTestingConnections,
    setupTestingConnections,
} from "../../../utils/test-utils"
import { BoundedText } from "./entity/BoundedText"

describe("database schema > mssql LIKE parameter lengths", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await Promise.all(
            setupTestingConnections({
                entities: [BoundedText],
                enabledDrivers: ["mssql"],
            }).map((options) =>
                new DataSource({
                    ...options,
                    synchronize: false,
                    dropSchema: false,
                }).initialize(),
            ),
        )
    })
    after(() => closeTestingConnections(dataSources))

    function findBy(
        dataSource: DataSource,
        where: FindOptionsWhere<BoundedText>,
    ) {
        // A CTE supplies bounded text without creating or modifying any tables.
        return dataSource
            .getRepository(BoundedText)
            .createQueryBuilder("row")
            .addCommonTableExpression(
                `SELECT 1 AS id,
                    CAST(N'AAAAAAAAAAAAAAAAAAAA' AS nvarchar(20)) AS unicode,
                    CAST('AAAAAAAAAAAAAAAAAAAA' AS varchar(20)) AS ascii
                 UNION ALL
                 SELECT 2, CAST(N'O''Brien' AS nvarchar(20)),
                    CAST('O''Brien' AS varchar(20))`,
                "bounded_like_text",
            )
            .setFindOptions({ where })
            .getMany()
    }

    for (const property of ["unicode", "ascii"] as const) {
        for (const operator of [Like, ILike]) {
            for (const length of [18, 19, 20, 21, 100]) {
                it(`searches ${property} with ${operator.name} and ${length + 2}-character patterns`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            const rows = await findBy(dataSource, {
                                [property]: operator(`%${"A".repeat(length)}%`),
                            })
                            expect(rows.map((row) => row.id)).to.deep.equal(
                                length <= 20 ? [1] : [],
                            )
                        }),
                    ))
            }

            it(`searches ${property} with nested ${operator.name} and independent predicates`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const rows = await findBy(dataSource, {
                            [property]: And(
                                Not(operator(`%${"A".repeat(20)}%`)),
                                Equal("O'Brien"),
                            ),
                        })
                        expect(rows.map((row) => row.id)).to.deep.equal([2])
                    }),
                ))
        }
    }
})
