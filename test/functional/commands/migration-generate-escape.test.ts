import { expect } from "chai"
import sinon from "sinon"
import { DataSource, DataSourceOptions } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { CommandUtils } from "../../../src/commands/CommandUtils"
import { MigrationGenerateCommand } from "../../../src/commands/MigrationGenerateCommand"
import { Post } from "./entity/Post"

describe("commands - migration generate - template literal escaping", () => {
    let dataSources: DataSource[]
    let createFileStub: sinon.SinonStub
    let loadDataSourceStub: sinon.SinonStub
    let migrationGenerateCommand: MigrationGenerateCommand

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres", "mysql", "mariadb", "cockroachdb"],
            schemaCreate: true,
            dropSchema: true,
        })
        migrationGenerateCommand = new MigrationGenerateCommand()
        createFileStub = sinon.stub(CommandUtils, "createFile")
        loadDataSourceStub = sinon.stub(CommandUtils, "loadDataSource")
    })

    afterEach(() => {
        createFileStub.resetHistory()
        loadDataSourceStub.resetHistory()
    })

    after(async () => {
        createFileStub.restore()
        loadDataSourceStub.restore()
        await closeTestingConnections(dataSources)
    })

    async function generateWithComment(
        dataSource: DataSource,
        comment: string,
        timestamp: string,
    ): Promise<string | undefined> {
        const driver = dataSource.driver.options.type

        if (driver === "postgres" || driver === "cockroachdb") {
            await dataSource.query(
                `COMMENT ON COLUMN "post"."title" IS '${comment}'`,
            )
        } else {
            const sqlComment = comment
                .replace(/\\/g, "\\\\")
                .replace(/'/g, "\\'")
            await dataSource.query(
                `ALTER TABLE \`post\` MODIFY COLUMN \`title\` varchar(255) NOT NULL COMMENT '${sqlComment}'`,
            )
        }

        const freshDataSource = new DataSource(
            dataSource.options as DataSourceOptions,
        )
        loadDataSourceStub.resolves(freshDataSource)

        await migrationGenerateCommand.handler({
            $0: "test",
            _: ["test"],
            path: "test-directory/test-migration",
            dataSource: "dummy-path",
            timestamp,
            exitProcess: false,
        })

        const fileContent = createFileStub.firstCall?.args[1] as
            | string
            | undefined
        createFileStub.resetHistory()

        if (driver === "postgres" || driver === "cockroachdb") {
            await dataSource.query(`COMMENT ON COLUMN "post"."title" IS NULL`)
        } else {
            await dataSource.query(
                `ALTER TABLE \`post\` MODIFY COLUMN \`title\` varchar(255) NOT NULL`,
            )
        }

        return fileContent
    }

    const cases: [string, string, (content: string) => void][] = [
        [
            "backticks",
            "contains `backticks` in comment",
            (content) => {
                expect(content).to.not.match(/[^\\]`contains/)
                expect(content).to.contain("\\`")
            },
        ],
        [
            "backslashes",
            "path\\to\\file",
            (content) => {
                expect(content).to.contain("\\\\")
            },
        ],
        [
            "template literal interpolation",
            "${process.exit(1)}",
            (content) => {
                expect(content).to.not.match(/(^|[^\\])\$\{process/)
                expect(content).to.contain("\\${")
            },
        ],
        [
            "backslash before interpolation",
            "\\${process.exit(1)}",
            (content) => {
                expect(content).to.not.match(/[^\\]\$\{process/)
            },
        ],
    ]

    for (const [label, comment, assertion] of cases) {
        it(`should escape ${label} in column comments`, async () => {
            for (const dataSource of dataSources) {
                const content = await generateWithComment(
                    dataSource,
                    comment,
                    "9999999999999",
                )
                expect(content).to.not.be.undefined
                assertion(content!)
            }
        })
    }
})
