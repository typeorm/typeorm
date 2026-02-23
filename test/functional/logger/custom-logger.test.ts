import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { AbstractLogger, DataSource, LogLevel, LogMessage } from "../../../src"
import sinon from "sinon"
import { expect } from "chai"
import { Post } from "./entity/Post"

describe("logger > custom logger extending AbstractLogger", () => {
    let dataSources: DataSource[]
    const fakeLog = sinon.fake()

    class CustomLogger extends AbstractLogger {
        protected writeLog(
            level: LogLevel,
            logMessage: LogMessage | LogMessage[],
        ) {
            const messages = this.prepareLogMessages(logMessage, {
                highlightSql: false,
            })

            for (const message of messages) {
                fakeLog(message.type ?? level, message.message)
            }
        }
    }

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
            logging: true,
            createLogger: () => new CustomLogger(),
        })
    })
    beforeEach(() => {
        fakeLog.resetHistory()
        return reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("should invoke custom logger writeLog for queries when logging is enabled (issue #10174)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                fakeLog.resetHistory()

                const repository = dataSource.getRepository(Post)
                await repository.save({ title: "test" })
                await repository.find()

                expect(fakeLog.called).to.be.true
                const queryLogs = fakeLog
                    .getCalls()
                    .filter((call: any) => call.args[0] === "query")
                expect(queryLogs.length).to.be.greaterThan(0)
            }),
        ))
})
