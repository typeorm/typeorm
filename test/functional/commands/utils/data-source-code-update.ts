import fs from "fs"
import path from "path"
import { expect } from "chai"
import { spawnSync } from "child_process"

describe("command utils - update data-source.ts on create commands", () => {
    const cliFilePath = path.join(__dirname, "../../../../src/cli")

    const rmdirSync = (dir: string) => {
        if (fs.rmSync != null) fs.rmSync(dir, { recursive: true })
        else fs.rmdirSync(dir, { recursive: true })
    }

    const runCommand = (cwd: string, bin: string, args: string[]) => {
        const res = spawnSync(bin, args, {
            cwd: cwd,
            env: process.env,
            stdio: "inherit"
        })

        expect(res.status).to.equal(0)
    }

    const runCliCommand = (cwd: string, argv: string[]) => {
        runCommand(cwd, "node", ["--require=ts-node/register", cliFilePath, ...argv])
    }

    async function testUpdatingDataSource(dataSourceFileContent: string) {
        const testDir = path.join(__dirname, "testCreateEntityImport")
        const entitiesFolderName = "entity";
        const entitiesDir = path.join(testDir, entitiesFolderName)
        const entityName = "User";

        const dataSourceFileName = "data-source.ts"
        const dataSourceFileNameWithoutExt = dataSourceFileName.slice(0, - (path.extname(dataSourceFileName).length))
        const dataSourceFilePath = path.join(testDir, dataSourceFileName)

        if (fs.existsSync(testDir)) rmdirSync(testDir)

        fs.mkdirSync(entitiesDir, { recursive: true })

        fs.writeFileSync(
            dataSourceFilePath,
            dataSourceFileContent,
            "utf8",
        )
        // fs.writeFileSync(jsFilePath, jsFileContent, "utf8")

        runCliCommand(testDir, [
            "entity:create",
            "--dataSource", dataSourceFileName,
            "--addImport", "true",
            entitiesFolderName + "/" + entityName
        ])

        const entityFilePath = path.join(entitiesDir, entityName + ".ts")

        // this is needed to make sure importing this file is successful in the
        // test environment, since importing "typeorm" inside a test would fail
        if (fs.existsSync(entityFilePath))
            fs.writeFileSync(
                entityFilePath,
                `
                import { Entity, BaseEntity, PrimaryGeneratedColumn } from "../../../../../../src/index";

                @Entity()
                export class ${entityName} extends BaseEntity {
                    @PrimaryGeneratedColumn()
                    id: number;
                }
                `,
                "utf8",
            )

        // this is required for the tests to work also after they're compiled to js
        const jsCheckFilePath = path.join(testDir, "check.ts")
        const jsCheckFileContent = `
            import { expect } from "chai"
            import * as dataSourceResult from "./${dataSourceFileNameWithoutExt}"

            expect(dataSourceResult).to.haveOwnProperty("AppDataSource")
            expect(dataSourceResult.AppDataSource).to.haveOwnProperty("options")
            expect(dataSourceResult.AppDataSource.options).to.haveOwnProperty("entities")

            const entities: any = dataSourceResult.AppDataSource.options.entities;
            expect(entities).to.be.an("array")
            expect(entities.length).to.be.gt(0)
            expect(entities[entities.length - 1].name).to.be.eq(${JSON.stringify(entityName)})
        `
        fs.writeFileSync(jsCheckFilePath, jsCheckFileContent, "utf8")
        runCommand(testDir, "node", ["--require=ts-node/register", jsCheckFilePath])

        rmdirSync(testDir)
    }

    describe("adds an import to the entity in data-source.ts when using entity:create", async function () {
        // these tests are relatively slow since they use spawnSync,
        // which is needed in order to use ts-node
        // without affecting the entire test environment
        this.timeout(1000 * 20)

        it("array literal expression", async () => {
            await testUpdatingDataSource(`
                import "reflect-metadata";
                import {DataSource} from "../../../../../src/index";

                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db",
                    entities: []
                });
            `)
        })

        it("variable declaration", async () => {
            await testUpdatingDataSource(`
                import "reflect-metadata";
                import {DataSource} from "../../../../../src/index";

                class Model {}

                const entities = [Model];

                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db",
                    entities: entities
                });
            `)
        })

        it("variable declaration - shorthand property assignment", async () => {
            await testUpdatingDataSource(`
                import "reflect-metadata";
                import {DataSource} from "../../../../../src/index";

                class Model {}

                const entities = [Model];

                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db",
                    entities: entities
                });
            `)
        })

        it("omitted", async () => {
            await testUpdatingDataSource(`
                import "reflect-metadata";
                import {DataSource} from "../../../../../src/index";

                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db"
                });
            `)
        })
    })
})
