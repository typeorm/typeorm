import { expect } from "chai"
import sinon from "sinon"

import { CommandUtils } from "../../../src/commands/CommandUtils"
import { InitCommand } from "../../../src/commands/InitCommand"

class TestInitCommand extends InitCommand {
    static dataSource(database: string): string {
        return this.getAppDataSourceTemplate(false, database)
    }

    static docker(database: string): string {
        return this.getDockerComposeTemplate(database)
    }

    static packageJson(database: string): Promise<string> {
        return this.appendPackageJson("{}", database, false, false)
    }
}

describe("commands - init - Postgres.js", () => {
    afterEach(() => sinon.restore())

    it("generates a postgres-js DataSource", () => {
        const output = TestInitCommand.dataSource("postgres-js")

        expect(output).to.include('type: "postgres-js"')
        expect(output).to.include('host: "localhost"')
        expect(output).to.include("port: 5432")
    })

    it("installs postgres instead of pg", async () => {
        sinon.stub(CommandUtils, "readFile").resolves(
            JSON.stringify({
                version: "1.1.0",
                dependencies: { "reflect-metadata": "^0.2.2" },
                devDependencies: {
                    "@types/node": "^22.0.0",
                    postgres: "^3.4.9",
                    "ts-node": "^10.9.2",
                    typescript: "^5.8.0",
                },
            }),
        )

        const generated = JSON.parse(
            await TestInitCommand.packageJson("postgres-js"),
        )

        expect(generated.dependencies.postgres).to.equal("^3.4.9")
        expect(generated.dependencies).not.to.have.property("pg")
    })

    it("reuses the PostgreSQL Docker service exactly", () => {
        const postgres = TestInitCommand.docker("postgres")
        const postgresJs = TestInitCommand.docker("postgres-js")

        expect(postgresJs).to.equal(postgres)
        expect(postgresJs).to.include('image: "postgres:17.2"')
        expect(postgresJs).to.include('"5432:5432"')
        expect(postgresJs).to.include('POSTGRES_DB: "typeorm"')
    })
})
