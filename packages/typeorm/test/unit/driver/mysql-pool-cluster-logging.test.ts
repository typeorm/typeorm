import { expect } from "chai"
import { EventEmitter } from "node:events"
import * as sinon from "sinon"
import { DataSource } from "../../../src/data-source/DataSource"
import type { MysqlDriver } from "../../../src/driver/mysql/MysqlDriver"
import { AdvancedConsoleLogger } from "../../../src/logger/AdvancedConsoleLogger"
import { PlatformTools } from "../../../src/platform/PlatformTools"

describe("MySQL PoolCluster logging", () => {
    let sandbox: sinon.SinonSandbox
    let driver: MysqlDriver
    let cluster: EventEmitter
    let log: sinon.SinonSpy
    let now: sinon.SinonStub

    beforeEach(async () => {
        sandbox = sinon.createSandbox()
        const dataSource = new DataSource({
            type: "mysql",
            database: "test",
            replication: {
                master: { host: "master", database: "test" },
                slaves: [{ host: "slave", database: "test" }],
                restoreNodeTimeout: 1000,
            },
        })
        driver = dataSource.driver as MysqlDriver
        log = sandbox.spy(dataSource.logger, "log")
        now = sandbox.stub(Date, "now").returns(0)
        cluster = Object.assign(new EventEmitter(), {
            add: sandbox.stub(),
            end: (callback: () => void) => callback(),
        })
        sandbox.stub(driver.mysql, "createPoolCluster").returns(cluster)
        const queryRunner = driver.createQueryRunner("master")
        sandbox.stub(queryRunner, "getVersion").resolves("8.0.0")
        sandbox.stub(queryRunner, "release").resolves()
        sandbox.stub(driver, "createQueryRunner").returns(queryRunner)
        await driver.connect()
    })

    afterEach(() => sandbox.restore())

    it("logs exclusion and successful recovery with the node role and elapsed time", () => {
        cluster.emit("offline", "MASTER")
        now.returns(1500)
        cluster.emit("online", "MASTER")

        expect(log.firstCall.args).to.deep.equal([
            "warn",
            "MySQL PoolCluster node temporarily excluded: MASTER (master), failedAt=1970-01-01T00:00:00.000Z",
        ])
        expect(log.secondCall.args).to.deep.equal([
            "info",
            "MySQL PoolCluster node recovered: MASTER (master), failedAt=1970-01-01T00:00:00.000Z, recoveredAt=1970-01-01T00:00:01.500Z, downtimeMs=1500",
        ])
    })

    it("preserves the first exclusion time and tracks nodes independently", () => {
        cluster.emit("offline", "MASTER")
        now.returns(500)
        cluster.emit("offline", "SLAVE0")
        now.returns(1000)
        cluster.emit("offline", "MASTER")
        now.returns(2000)
        cluster.emit("online", "MASTER")
        cluster.emit("online", "SLAVE0")

        expect(log.getCall(3).args[1]).to.include("downtimeMs=2000")
        expect(log.getCall(4).args[1]).to.include("SLAVE0 (slave)")
        expect(log.getCall(4).args[1]).to.include("downtimeMs=1500")
    })

    it("ignores untracked recovery and starts a new interval after recovery", () => {
        cluster.emit("online", "MASTER")
        expect(log.called).to.be.false
        cluster.emit("offline", "MASTER")
        now.returns(1000)
        cluster.emit("online", "MASTER")
        cluster.emit("online", "MASTER")
        expect(log.callCount).to.equal(2)
        now.returns(2000)
        cluster.emit("offline", "MASTER")
        now.returns(2500)
        cluster.emit("online", "MASTER")
        expect(log.lastCall.args[1]).to.include("downtimeMs=500")
    })

    it("logs removal and discards any pending recovery", () => {
        cluster.emit("remove", "SLAVE0")
        expect(log.firstCall.args).to.deep.equal([
            "warn",
            "MySQL PoolCluster node removed: SLAVE0 (slave)",
        ])
        cluster.emit("offline", "MASTER")
        cluster.emit("remove", "MASTER")
        cluster.emit("online", "MASTER")
        expect(log.callCount).to.equal(3)
    })

    it("starts with fresh failure state when reconnecting", async () => {
        cluster.emit("offline", "MASTER")
        await driver.disconnect()
        cluster = Object.assign(new EventEmitter(), { add: sandbox.stub() })
        const createPoolCluster = driver.mysql
            .createPoolCluster as sinon.SinonStub
        createPoolCluster.returns(cluster)
        await driver.connect()
        cluster.emit("online", "MASTER")
        expect(log.callCount).to.equal(1)
    })

    it("respects the built-in logger's warn and info settings", () => {
        const warn = sandbox.stub(console, "warn")
        const info = sandbox.stub(PlatformTools, "logInfo")
        driver.dataSource.logger = new AdvancedConsoleLogger(false)
        cluster.emit("offline", "MASTER")
        cluster.emit("online", "MASTER")
        expect(warn.called).to.be.false
        expect(info.called).to.be.false

        driver.dataSource.logger = new AdvancedConsoleLogger(["warn"])
        cluster.emit("offline", "MASTER")
        cluster.emit("online", "MASTER")
        expect(warn.callCount).to.equal(1)
        expect(info.called).to.be.false

        driver.dataSource.logger = new AdvancedConsoleLogger(["info"])
        cluster.emit("offline", "MASTER")
        cluster.emit("online", "MASTER")
        expect(warn.callCount).to.equal(1)
        expect(info.callCount).to.equal(1)
    })
})
