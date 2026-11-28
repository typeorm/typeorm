import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import { Readable, Writable } from "stream"
import { finished, pipeline } from "stream/promises"
import type { ReadStream } from "../../../src/platform/PlatformTools"
import { DataSource } from "../../../src/data-source/DataSource"

describe("SelectQueryBuilder > PostgreSQL transactional streams", () => {
    afterEach(() => sinon.restore())

    function setup(supplied = false) {
        const dataSource = new DataSource({ type: "postgres" })
        const runner = dataSource.createQueryRunner()
        sinon.stub(dataSource, "createQueryRunner").returns(runner)
        const start = sinon
            .stub(runner, "startTransaction")
            .callsFake(async () => {
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
            runner,
            start,
            commit,
            rollback,
            release,
            cursor,
            open,
        }
    }

    for (const supplied of [false, true]) {
        it(`should roll back failed stream setup (supplied=${supplied})`, async () => {
            const { builder, open, rollback, release } = setup(supplied)
            const error = new Error("stream setup failed")
            open.rejects(error)
            await expect(
                builder.useTransaction(true).stream(),
            ).to.be.rejectedWith(error)
            expect(rollback.calledOnce).to.equal(true)
            expect(release.callCount).to.equal(supplied ? 0 : 1)
        })

        it(`should close the cursor before rollback when destroyed before reading (supplied=${supplied})`, async () => {
            const { builder, cursor, commit, rollback, release } =
                setup(supplied)
            rollback.callsFake(async () => {
                expect(cursor.closed).to.equal(true)
            })
            const stream = await builder.useTransaction(true).stream()
            const done = finished(stream)
            stream.destroy()
            await expect(done).to.be.rejectedWith(/premature close/i)
            expect(commit.called).to.equal(false)
            expect(rollback.calledOnce).to.equal(true)
            expect(release.callCount).to.equal(supplied ? 0 : 1)
        })
    }

    it("should retain a supplied runner when the builder switches runners", async () => {
        const { builder, cursor, release } = setup(true)
        const stream = await builder.useTransaction(true).stream()
        const other = new DataSource({ type: "postgres" }).createQueryRunner()
        builder.setQueryRunner(other)
        stream.resume()
        cursor.push(null)
        await finished(stream)
        expect(release.called).to.equal(false)
    })

    for (const active of [false, true]) {
        it(`should clean up a rejected start with transaction active=${active}`, async () => {
            const { builder, runner, start, rollback, release } = setup()
            const error = new Error("start failed")
            start.callsFake(async () => {
                sinon.stub(runner, "isTransactionActive").value(active)
                throw error
            })
            await expect(
                builder.useTransaction(true).stream(),
            ).to.be.rejectedWith(error)
            expect(rollback.callCount).to.equal(active ? 1 : 0)
            expect(release.calledOnce).to.equal(true)
        })
    }

    it("should wait for commit and release before end", async () => {
        const { builder, cursor, commit, release } = setup()
        const pending = sinon.promise<void>()
        commit.returns(pending)
        const stream = await builder.useTransaction(true).stream()
        const done = finished(stream)
        stream.resume()
        cursor.push(null)
        await new Promise<void>((resolve) => setImmediate(resolve))
        expect(commit.calledOnce).to.equal(true)
        expect(stream.readableEnded).to.equal(false)
        expect(release.called).to.equal(false)
        await pending.resolve(undefined)
        await done
        expect(release.calledOnce).to.equal(true)
    })

    it("should keep a short cursor open when its consumer stops after one row", async () => {
        const { builder, cursor, commit, rollback, release } = setup()
        cursor.push({ id: 1 })
        cursor.push({ id: 2 })
        cursor.push({ id: 3 })
        cursor.push(null)
        const stream = await builder.useTransaction(true).stream()
        const done = finished(stream)
        for await (const row of stream) {
            expect(row).to.deep.equal({ id: 1 })
            await new Promise<void>((resolve) => setImmediate(resolve))
            break
        }
        await expect(done).to.be.rejected
        expect(commit.called).to.equal(false)
        sinon.assert.callOrder(rollback, release)
    })

    for (const failWrite of [false, true]) {
        it(`should defer commit while the final row is buffered (write fails=${failWrite})`, async () => {
            const { builder, cursor, commit, rollback, release } = setup()
            const stream = await builder.useTransaction(true).stream()
            const failure = new Error("destination failed")
            const pending = sinon.promise<void>()
            const sink = new Writable({
                objectMode: true,
                highWaterMark: 1,
                write(row, _encoding, callback) {
                    if (row.id === 1) {
                        void pending.then(() =>
                            callback(failWrite ? failure : null),
                        )
                    } else {
                        callback()
                    }
                },
            })
            const done = pipeline(stream, sink)
            cursor.push({ id: 1 })
            cursor.push({ id: 2 })
            cursor.push(null)
            await new Promise<void>((resolve) => setImmediate(resolve))
            expect(stream.readableLength).to.equal(1)
            const committedWithBufferedRow = commit.called
            await pending.resolve(undefined)
            if (failWrite) await expect(done).to.be.rejectedWith(failure)
            else await done
            expect(committedWithBufferedRow).to.equal(false)
            expect(commit.callCount).to.equal(failWrite ? 0 : 1)
            expect(rollback.callCount).to.equal(failWrite ? 1 : 0)
            expect(release.calledOnce).to.equal(true)
        })
    }

    it("should preserve manual reads and remove the drain listener when cancelled", async () => {
        const { builder, cursor, commit, rollback } = setup()
        const stream = await builder.useTransaction(true).stream()
        cursor.push({ id: 1 })
        cursor.push({ id: 2 })
        cursor.push(null)
        expect(stream.read(64)).to.equal(null)
        await new Promise<void>((resolve) => setImmediate(resolve))
        expect(stream.readableLength).to.equal(2)
        expect(stream.read(64)).to.deep.equal({ id: 1 })
        expect(commit.called).to.equal(false)
        const done = finished(stream)
        stream.destroy()
        await expect(done).to.be.rejectedWith(/premature close/i)
        expect(rollback.calledOnce).to.equal(true)
        expect(stream.listenerCount("data")).to.equal(0)
    })

    it("should finish an in-flight commit once when the consumer destroys the stream", async () => {
        const { builder, cursor, commit, rollback, release } = setup()
        const pending = sinon.promise<void>()
        commit.returns(pending)
        const stream = await builder.useTransaction(true).stream()
        const done = finished(stream)
        stream.resume()
        cursor.push(null)
        await new Promise<void>((resolve) => setImmediate(resolve))
        expect(commit.calledOnce).to.equal(true)
        stream.destroy()
        await pending.resolve(undefined)
        await expect(done).to.be.rejectedWith(/premature close/i)
        expect(rollback.called).to.equal(false)
        expect(release.calledOnce).to.equal(true)
    })

    it("should surface a commit failure after rollback and release", async () => {
        const { builder, cursor, commit, rollback, release } = setup()
        const failure = new Error("commit failed")
        commit.rejects(failure)
        release.rejects(new Error("release failed"))
        const stream = await builder.useTransaction(true).stream()
        const done = finished(stream)
        stream.resume()
        cursor.push(null)
        await expect(done).to.be.rejectedWith(failure)
        sinon.assert.callOrder(commit, rollback, release)
        expect(release.calledOnce).to.equal(true)
    })

    it("should propagate cursor errors after rollback and release", async () => {
        const { builder, cursor, commit, rollback, release } = setup()
        const failure = new Error("cursor failed")
        const stream = await builder.useTransaction(true).stream()
        const done = finished(stream)
        cursor.destroy(failure)
        await expect(done).to.be.rejectedWith(failure)
        expect(commit.called).to.equal(false)
        sinon.assert.callOrder(rollback, release)
    })

    it("should retain the native cursor and a caller's existing transaction", async () => {
        const { builder, runner, cursor, start, commit, rollback, release } =
            setup(true)
        sinon.stub(runner, "isTransactionActive").value(true)
        expect(await builder.useTransaction(true).stream()).to.equal(cursor)
        expect(
            [start, commit, rollback, release].every((stub) => !stub.called),
        ).to.equal(true)
    })
})
