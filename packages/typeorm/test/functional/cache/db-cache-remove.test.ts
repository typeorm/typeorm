import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../src"
import type { QueryRunner } from "../../../src"
import {
    closeTestingConnections,
    setupTestingConnections,
} from "../../utils/test-utils"

// Regression for https://github.com/typeorm/typeorm/issues/12935
describe("database cache > remove error cleanup", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await Promise.all(
            setupTestingConnections({
                enabledDrivers: ["postgres"],
                cache: true,
            })
                .filter((options) => options.type === "postgres")
                .map((options) =>
                    new DataSource({
                        ...options,
                        poolSize: 1,
                        extra: {
                            ...options.extra,
                            max: 1,
                            connectionTimeoutMillis: 1000,
                        },
                    }).initialize(),
                ),
        )
    })
    beforeEach(() =>
        Promise.all(
            dataSources.map((dataSource) => dataSource.synchronize(true)),
        ),
    )
    after(() => closeTestingConnections(dataSources))

    for (const suppliedRunner of [false, true]) {
        it(`should ${suppliedRunner ? "retain" : "release"} the runner after a database error`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.query('DROP TABLE "query-result-cache"')
                    const createRunner = sinon.spy(
                        dataSource,
                        "createQueryRunner",
                    )
                    let queryRunner: QueryRunner | undefined
                    try {
                        const supplied = suppliedRunner
                            ? dataSource.createQueryRunner()
                            : undefined
                        await expect(
                            dataSource.queryResultCache!.remove(
                                ["first", "second"],
                                supplied,
                            ),
                        ).to.be.rejectedWith("does not exist")
                        queryRunner = createRunner.lastCall.returnValue
                        expect(queryRunner!.isReleased).to.equal(
                            !suppliedRunner,
                        )
                        const result = suppliedRunner
                            ? await queryRunner!.query("SELECT 1 AS value")
                            : await dataSource.query("SELECT 1 AS value")
                        expect(result).to.deep.equal([{ value: 1 }])
                    } finally {
                        createRunner.restore()
                        if (queryRunner && !queryRunner.isReleased)
                            await queryRunner.release()
                    }
                }),
            ))
    }
})
