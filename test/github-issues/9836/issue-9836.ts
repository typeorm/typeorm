import "reflect-metadata"
import * as fs from "fs"
import path from "path"
import sinon from "sinon"
import { expect } from "chai"
import { capitalizeFirstLetter } from "../../../src/util/StringUtils"
import { MigrationCreateCommand } from "../../../src/commands/MigrationCreateCommand"
import { CommandUtils } from "../../../src/commands/CommandUtils"

describe("github issues > #9836 A class name in migration file should be started with uppercase", () => {
    const testTimestampArg = "1641163894670"
    const testPathArg = "./test/github-issues/9836/test-migration"

    const testHandlerArgs = (options: Record<string, any>) => ({
        $0: "test",
        _: ["test"],
        timestamp: testTimestampArg,
        ...options,
    })

    after(() => {
        const filename = path.basename(testPathArg)
        const fullPath =
            path.dirname(testPathArg) + "/" + testTimestampArg + "-" + filename
        const jsFullPath = fullPath + ".js"
        const tsFullPath = fullPath + ".ts"

        if (fs.existsSync(jsFullPath)) {
            fs.unlinkSync(jsFullPath)
        }

        if (fs.existsSync(tsFullPath)) {
            fs.unlinkSync(tsFullPath)
        }
    })

    it("should capitalize first letter", () =>
        expect(capitalizeFirstLetter("lowercase")).to.equal("Lowercase"))

    it("should captialize first letter of generated class when excute migration:create command with ts option", async () => {
        const createFileSpy = sinon.spy(CommandUtils, "createFile")

        const migrationCreateCommand = new MigrationCreateCommand()

        // simulate args: `npm run typeorm migration:create <path>`
        await migrationCreateCommand.handler(
            testHandlerArgs({
                path: testPathArg,
                outputJs: false,
            }),
        )

        expect(
            createFileSpy.calledWith(
                sinon.match(/test-migration.ts/),
                sinon.match(/class TestMigration1641163894670/),
            ),
        ).to.be.true

        createFileSpy.restore()
    })

    it("should captialize first letter of generated class when excute migration:create command with js option", async () => {
        const createFileSpy = sinon.spy(CommandUtils, "createFile")

        const migrationCreateCommand = new MigrationCreateCommand()

        // simulate args: `npm run typeorm migration:create <path>`
        await migrationCreateCommand.handler(
            testHandlerArgs({
                path: testPathArg,
                outputJs: true,
            }),
        )

        expect(
            createFileSpy.calledWith(
                sinon.match(/test-migration.js/),
                sinon.match(/class TestMigration1641163894670/),
            ),
        ).to.be.true

        createFileSpy.restore()
    })
})
