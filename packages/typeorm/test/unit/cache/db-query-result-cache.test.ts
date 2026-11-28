import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../src/data-source/DataSource"
import { DbQueryResultCache } from "../../../src/cache/DbQueryResultCache"
import { QueryResult } from "../../../src/query-runner/QueryResult"

// Regression for https://github.com/typeorm/typeorm/issues/12935
describe("DbQueryResultCache > remove", () => {
    afterEach(() => sinon.restore())

    for (const suppliedRunner of [false, true]) {
        for (const identifiers of [[], ["first"], ["first", "second"]]) {
            it(`should remove ${identifiers.length} identifiers with a ${suppliedRunner ? "supplied" : "created"} runner`, async () => {
                const dataSource = new DataSource({ type: "postgres" })
                const queryRunner = dataSource.createQueryRunner()
                const query = sinon
                    .stub(queryRunner, "query")
                    .resolves(new QueryResult())
                sinon.stub(dataSource, "createQueryRunner").returns(queryRunner)
                const release = sinon.spy(queryRunner, "release")
                const cache = new DbQueryResultCache(dataSource)

                await cache.remove(
                    identifiers,
                    suppliedRunner ? queryRunner : undefined,
                )

                expect(query.callCount).to.equal(identifiers.length)
                expect(
                    query.getCalls().map((call) => call.args[1]),
                ).to.deep.equal(identifiers.map((identifier) => [identifier]))
                expect(release.callCount).to.equal(suppliedRunner ? 0 : 1)
            })
        }

        it(`should preserve errors and ${suppliedRunner ? "retain" : "release"} the runner after failed removal`, async () => {
            const dataSource = new DataSource({ type: "postgres" })
            const queryRunner = dataSource.createQueryRunner()
            const queryError = new Error("delete failed")
            sinon.stub(queryRunner, "query").rejects(queryError)
            sinon.stub(dataSource, "createQueryRunner").returns(queryRunner)
            const release = sinon.spy(queryRunner, "release")
            const cache = new DbQueryResultCache(dataSource)

            await expect(
                cache.remove(
                    ["first"],
                    suppliedRunner ? queryRunner : undefined,
                ),
            ).to.be.rejectedWith(queryError)
            expect(release.callCount).to.equal(suppliedRunner ? 0 : 1)
        })
    }

    it("should settle pending deletions before releasing the runner after an error", async () => {
        const dataSource = new DataSource({ type: "mysql" })
        const queryRunner = dataSource.createQueryRunner()
        const firstError = new Error("first delete failed")
        const query = sinon.stub(queryRunner, "query")
        query.onFirstCall().rejects(firstError)
        let finishPending: (result: QueryResult) => void
        query.onSecondCall().returns(
            new Promise<QueryResult>((resolve) => {
                finishPending = resolve
            }),
        )
        sinon.stub(dataSource, "createQueryRunner").returns(queryRunner)
        const release = sinon.spy(queryRunner, "release")
        const cache = new DbQueryResultCache(dataSource)
        let settled = false
        const removal = cache.remove(["first", "second"]).catch((error) => {
            settled = true
            return error
        })

        try {
            await new Promise((resolve) => setImmediate(resolve))
            expect(query.callCount).to.equal(2)
            expect(release.callCount).to.equal(0)
            expect(settled).to.equal(false)
        } finally {
            finishPending!(new QueryResult())
        }

        expect(await removal).to.equal(firstError)
        expect(release.callCount).to.equal(1)
    })

    for (const driverType of ["postgres", "cockroachdb"] as const) {
        it(`should remove identifiers sequentially on ${driverType} to avoid concurrent pg client queries`, async () => {
            const dataSource = new DataSource(
                driverType === "cockroachdb"
                    ? { type: "cockroachdb", timeTravelQueries: false }
                    : { type: "postgres" },
            )
            const queryRunner = dataSource.createQueryRunner()
            let inFlight = 0
            let maxInFlight = 0
            const query = sinon
                .stub(queryRunner, "query")
                .callsFake(async () => {
                    inFlight++
                    if (inFlight > maxInFlight) maxInFlight = inFlight
                    await new Promise((resolve) => setImmediate(resolve))
                    inFlight--
                    return new QueryResult()
                })
            sinon.stub(dataSource, "createQueryRunner").returns(queryRunner)
            const cache = new DbQueryResultCache(dataSource)

            await cache.remove(["first", "second", "third"])

            expect(query.callCount).to.equal(3)
            expect(maxInFlight).to.equal(1)
        })

        it(`should still attempt remaining deletions and rethrow the first error on ${driverType}`, async () => {
            const dataSource = new DataSource(
                driverType === "cockroachdb"
                    ? { type: "cockroachdb", timeTravelQueries: false }
                    : { type: "postgres" },
            )
            const queryRunner = dataSource.createQueryRunner()
            const firstError = new Error("first delete failed")
            const query = sinon.stub(queryRunner, "query")
            query.onFirstCall().rejects(firstError)
            query.onSecondCall().resolves(new QueryResult())
            query.onThirdCall().resolves(new QueryResult())
            sinon.stub(dataSource, "createQueryRunner").returns(queryRunner)
            const release = sinon.spy(queryRunner, "release")
            const cache = new DbQueryResultCache(dataSource)

            await expect(
                cache.remove(["first", "second", "third"]),
            ).to.be.rejectedWith(firstError)

            expect(query.callCount).to.equal(3)
            expect(release.callCount).to.equal(1)
        })
    }

    for (const deletionFails of [false, true]) {
        for (const releaseThrows of [false, true]) {
            it(`should report the ${deletionFails ? "deletion" : "release"} error when release ${releaseThrows ? "throws" : "rejects"}`, async () => {
                const dataSource = new DataSource({ type: "postgres" })
                const queryRunner = dataSource.createQueryRunner()
                const deletionError = new Error("delete failed")
                const releaseError = new Error("release failed")
                const query = sinon.stub(queryRunner, "query")
                if (deletionFails) query.rejects(deletionError)
                else query.resolves(new QueryResult())
                const release = sinon.stub(queryRunner, "release")
                if (releaseThrows) release.throws(releaseError)
                else release.rejects(releaseError)
                sinon.stub(dataSource, "createQueryRunner").returns(queryRunner)

                const error = await new DbQueryResultCache(dataSource)
                    .remove(["first"])
                    .catch((error) => error)

                expect(error).to.equal(
                    deletionFails ? deletionError : releaseError,
                )
                expect(release.callCount).to.equal(1)
            })
        }
    }
})
