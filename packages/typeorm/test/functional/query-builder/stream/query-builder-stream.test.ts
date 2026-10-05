import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../../src"
import type { QueryRunner } from "../../../../src"
import {
    closeTestingConnections,
    setupTestingConnections,
} from "../../../utils/test-utils"

// Regression for https://github.com/typeorm/typeorm/issues/12934
describe("query builder > stream connection ownership", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await Promise.all(
            setupTestingConnections({ enabledDrivers: ["postgres"] })
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
    after(() => closeTestingConnections(dataSources))

    for (const suppliedRunner of [false, true]) {
        for (const completion of ["end", "destroy", "error"]) {
            it(`should ${suppliedRunner ? "retain" : "release"} the query runner after ${completion}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const createRunner = sinon.spy(
                            dataSource,
                            "createQueryRunner",
                        )
                        let queryRunner: QueryRunner | undefined
                        try {
                            const supplied = suppliedRunner
                                ? dataSource.createQueryRunner()
                                : undefined
                            const stream = await dataSource
                                .createQueryBuilder(supplied)
                                .select("value")
                                .from(
                                    "(SELECT generate_series(1, 1000) AS value)",
                                    "rows",
                                )
                                .stream()
                            queryRunner = createRunner.lastCall.returnValue
                            const release = sinon.spy(queryRunner!, "release")
                            const streamError = new Error("stop reading")
                            const errors: Error[] = []
                            let rows = 0
                            const closed = new Promise<void>((resolve) =>
                                stream.once("close", resolve),
                            )
                            stream.on("error", (error) => errors.push(error))
                            stream.on("data", () => {
                                rows++
                                expect(queryRunner!.isReleased).to.equal(false)
                                if (completion !== "end") {
                                    stream.pause()
                                    stream.destroy(
                                        completion === "error"
                                            ? streamError
                                            : undefined,
                                    )
                                }
                            })
                            await closed

                            expect(rows).to.equal(
                                completion === "end" ? 1000 : 1,
                            )
                            expect(errors).to.deep.equal(
                                completion === "error" ? [streamError] : [],
                            )
                            expect(queryRunner!.isReleased).to.equal(
                                !suppliedRunner,
                            )
                            expect(release.callCount).to.equal(
                                suppliedRunner ? 0 : 1,
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
    }
})
