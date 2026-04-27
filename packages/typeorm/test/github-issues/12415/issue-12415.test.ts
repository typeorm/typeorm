import { expect } from "chai"
import { MigrationCreateCommand } from "../../../src/commands/MigrationCreateCommand"
import { MigrationGenerateCommand } from "../../../src/commands/MigrationGenerateCommand"

class TestableMigrationGenerateCommand extends MigrationGenerateCommand {
    static getTypeScriptTemplate(name: string, timestamp: number): string {
        return super.getTemplate(name, timestamp, [], [])
    }

    static getJavaScriptTemplate(name: string, timestamp: number): string {
        return super.getJavascriptTemplate(name, timestamp, [], [], false)
    }
}

class TestableMigrationCreateCommand extends MigrationCreateCommand {
    static getTypeScriptTemplate(name: string, timestamp: number): string {
        return super.getTemplate(name, timestamp)
    }
}

describe("github issues > #12415 migration class names", () => {
    it("generates valid migration class names from filenames with invalid identifier characters", () => {
        const timestamp = 1610975184784
        const typeScriptTemplate =
            TestableMigrationGenerateCommand.getTypeScriptTemplate(
                "refresh#2",
                timestamp,
            )
        const javaScriptTemplate =
            TestableMigrationGenerateCommand.getJavaScriptTemplate(
                "refresh#2",
                timestamp,
            )

        for (const template of [typeScriptTemplate, javaScriptTemplate]) {
            expect(template).to.contain(`class Refresh2${timestamp}`)
            expect(template).to.contain(`name = 'Refresh2${timestamp}'`)
            expect(template).not.to.contain(`Refresh#2${timestamp}`)
        }
    })

    it("prefixes migration class names that do not start with an identifier character", () => {
        const timestamp = 1610975184784
        const template = TestableMigrationCreateCommand.getTypeScriptTemplate(
            "2-refresh",
            timestamp,
        )

        expect(template).to.contain(`class Migration2Refresh${timestamp}`)
    })
})
