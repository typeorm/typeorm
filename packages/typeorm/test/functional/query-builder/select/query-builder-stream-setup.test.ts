import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../../src/data-source/DataSource"

describe("query builder > stream setup", () => {
    let dataSource: DataSource

    beforeEach(async () => {
        dataSource = await new DataSource({ type: "sqljs" }).initialize()
    })

    afterEach(async () => {
        sinon.restore()
        await dataSource.destroy()
    })

    it("should release its own query runner when the driver cannot stream", async () => {
        const runner = dataSource.createQueryRunner()
        const release = sinon.spy(runner, "release")
        const builder = dataSource
            .createQueryBuilder()
            .select("1")
            .from("test", "t")

        await expect(builder.stream()).to.be.rejectedWith(
            "Stream is not supported by sqlite driver.",
        )
        expect(release).to.have.been.calledOnce
    })

    it("should preserve an existing transaction on a shared runner", async () => {
        const runner = dataSource.createQueryRunner()
        const release = sinon.spy(runner, "release")
        await runner.startTransaction()
        try {
            const builder = dataSource
                .createQueryBuilder()
                .select("1")
                .from("test", "t")
                .useTransaction(true)

            await expect(builder.stream()).to.be.rejectedWith(
                "Stream is not supported by sqlite driver.",
            )
            expect(runner.isTransactionActive).to.be.true
            expect(release).not.to.have.been.called
        } finally {
            await runner.rollbackTransaction()
            await runner.release()
        }
    })

    for (const supplied of [false, true]) {
        it(`should preserve a rejected stream setup error (supplied runner: ${supplied})`, async () => {
            const runner = dataSource.createQueryRunner()
            const failure = new Error("stream setup failed")
            sinon.stub(runner, "stream").rejects(failure)
            const release = sinon
                .stub(runner, "release")
                .rejects(new Error("release failed"))
            const builder = dataSource
                .createQueryBuilder(supplied ? runner : undefined)
                .select("1")
                .from("test", "t")

            await expect(builder.stream()).to.be.rejectedWith(failure)
            expect(release.callCount).to.equal(supplied ? 0 : 1)
        })
    }
})
