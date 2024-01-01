import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import {
    AbstractLogger,
    DataSource,
    LogLevel,
    LogMessage,
    QueryRunner,
} from "../../../src"
import sinon from "sinon"
import { expect } from "chai"

xdescribe("github issues > #10322 logMigration of AbstractLogger has wrong logging condition.", () => {
    let dataSources: DataSource[]
    const fakeLog = sinon.fake()

    class TestLogger extends AbstractLogger {
        protected writeLog(
            level: LogLevel,
            logMessage: LogMessage | LogMessage[],
            queryRunner?: QueryRunner,
        ) {
            const messages = this.prepareLogMessages(logMessage, {
                highlightSql: false,
            })

            for (let message of messages) {
                switch (message.type ?? level) {
                    case "migration":
                        fakeLog(message.message)
                        break
                }
            }
        }
    }

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            migrations: [__dirname + "/migration/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            createLogger: () => new TestLogger(),
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should call fakeLog when migration failed", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                try {
                    await dataSource.runMigrations()
                } catch (e) {
                    expect(fakeLog.calledOnce).to.be.true
                }
            }),
        ))
})
