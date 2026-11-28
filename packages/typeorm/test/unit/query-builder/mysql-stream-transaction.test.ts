import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import { Readable } from "stream"
import type { ReadStream } from "../../../src/platform/PlatformTools"
import { DataSource } from "../../../src/data-source/DataSource"

describe("SelectQueryBuilder > MySQL transactional streams", () => {
    afterEach(() => sinon.restore())

    function setup(supplied = false) {
        const dataSource = new DataSource({ type: "mysql" })
        const runner = dataSource.createQueryRunner()
        sinon.stub(dataSource, "createQueryRunner").returns(runner)
        sinon.stub(runner, "startTransaction").callsFake(async () => {
            sinon.stub(runner, "isTransactionActive").value(true)
        })
        const commit = sinon.stub(runner, "commitTransaction").resolves()
        const rollback = sinon.stub(runner, "rollbackTransaction").resolves()
        const release = sinon.stub(runner, "release").resolves()
        const cursor = new Readable({ objectMode: true, read() {} })
        const open = sinon
            .stub(runner, "stream")
            .resolves(cursor as unknown as ReadStream)
        const builder = dataSource
            .createQueryBuilder(supplied ? runner : undefined)
            .select("1", "value")
            .from("test_table", "t")
        return {
            builder,
            commit,
            rollback,
            release,
            cursor,
            open,
        }
    }

    for (const supplied of [false, true]) {
        it(`should roll back a rejected mysql2 stream setup (supplied=${supplied})`, async () => {
            const { builder, open, commit, rollback, release } = setup(supplied)
            const failure = new Error("stream setup failed")
            open.rejects(failure)
            await expect(
                builder.useTransaction(true).stream(),
            ).to.be.rejectedWith(failure)
            expect(commit.called).to.equal(false)
            expect(rollback.calledOnce).to.equal(true)
            expect(release.callCount).to.equal(supplied ? 0 : 1)
        })

        it(`should destroy the unread mysql2 stream before rolling back a failed commit (supplied=${supplied})`, async () => {
            const { builder, cursor, commit, rollback, release } =
                setup(supplied)
            const failure = new Error("commit failed")
            commit.rejects(failure)
            const destroy = sinon.spy(cursor, "destroy")
            await expect(
                builder.useTransaction(true).stream(),
            ).to.be.rejectedWith(failure)
            sinon.assert.callOrder(commit, destroy, rollback)
            expect(release.callCount).to.equal(supplied ? 0 : 1)
        })
    }

    it("should keep the mysql2 client until commit and return the native stream", async () => {
        const { builder, cursor, open, commit, release } = setup()
        const pending = sinon.promise<void>()
        commit.returns(pending)
        const opening = builder.useTransaction(true).stream()
        await new Promise<void>((resolve) => setImmediate(resolve))
        // The driver may finish its SELECT while the commit is still pending.
        open.firstCall.args[2]?.()
        expect(release.called).to.equal(false)
        await pending.resolve(undefined)
        expect(await opening).to.equal(cursor)
        expect(release.calledOnce).to.equal(true)
        expect(cursor.listenerCount("error")).to.equal(0)
    })
})
