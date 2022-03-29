import fs from "fs"
import path from "path"
import { expect } from "chai"
import { spawnSync } from "child_process"
import { getRelativeImportPath } from "../../../../src/codebase-updater/codebase-utils/getRelativeImportPath"

describe("command utils - update data-source.ts on create commands", () => {
    const typeormLibraryPath = path.join(__dirname, "../../../../src/index")
    const cliFilePath = path.join(__dirname, "../../../../src/cli")
    const testDir = path.join(__dirname, "testCreateEntityImport")

    const rmdirSync = (dir: string) => {
        if (fs.rmSync != null) fs.rmSync(dir, { recursive: true })
        else fs.rmdirSync(dir, { recursive: true })
    }

    const runCommand = (cwd: string, bin: string, args: string[]) => {
        const res = spawnSync(bin, args, {
            cwd: cwd,
            env: process.env,
            stdio: "inherit",
        })

        expect(res.status).to.equal(0)
    }

    const runCliCommand = (cwd: string, argv: string[]) => {
        runCommand(cwd, "node", [
            "--require=ts-node/register",
            cliFilePath,
            ...argv,
        ])
    }

    const runCreateEntityCommand = async ({
        dataSourceFilePath,
        entityPath,
    }: {
        dataSourceFilePath: string
        entityPath: string
    }) => {
        runCliCommand(testDir, [
            "entity:create",
            "--dataSource",
            dataSourceFilePath,
            "--addImport",
            "true",
            entityPath,
        ])

        // uncomment this to be able to debug the command,
        // but don't keep this as it only works when ts-node is loaded to mocha
        //
        // const { EntityCreateCommand } = require("../../../../src/commands/EntityCreateCommand");
        // await (new EntityCreateCommand()).handler({
        //     path: path.join(testDir, entityPath),
        //     dataSource: path.join(testDir, dataSourceFilePath),
        //     addImport: true
        // })
    }

    function createDir(dirPath: string) {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
    }

    function writeFile(filePath: string, content: string) {
        createDir(path.dirname(filePath))
        fs.writeFileSync(filePath, content, "utf8")
    }

    // this is required for the tests to work also after the entire `tests` directory is compiled to js
    function runTsFile(filePath: string, tsCode: string) {
        writeFile(filePath, tsCode)
        runCommand(testDir, "node", ["--require=ts-node/register", filePath])
    }

    async function testContainedDataSourceFile(
        entityName: string = "User",
        dataSourceCode: string,
        testCode: string,
    ) {
        const entitiesFolder = "entities"
        const dataSourceFile = "data-source.ts"
        const entityFile = entityName + ".ts"

        const dataSourceFilePath = path.join(testDir, dataSourceFile)
        writeFile(
            dataSourceFilePath,
            `
                import "reflect-metadata";
                import {DataSource} from ${JSON.stringify(
                    getRelativeImportPath(
                        dataSourceFilePath,
                        typeormLibraryPath,
                        "commonjs",
                    ),
                )};

                ${dataSourceCode}
            `,
        )

        await runCreateEntityCommand({
            dataSourceFilePath: dataSourceFile,
            entityPath: entitiesFolder + "/" + entityName,
        })

        // this is needed to make sure importing this file is successful in the
        // test environment, since importing "typeorm" inside a test would fail
        const entityFilePath = path.join(testDir, entitiesFolder, entityFile)
        writeFile(
            entityFilePath,
            `
                import { Entity, BaseEntity, PrimaryGeneratedColumn } from ${JSON.stringify(
                    getRelativeImportPath(
                        entityFilePath,
                        typeormLibraryPath,
                        "commonjs",
                    ),
                )};

                @Entity()
                export class ${entityName} extends BaseEntity {
                    @PrimaryGeneratedColumn()
                    id: number;
                }
            `,
        )

        const checkFilePath = path.join(testDir, "check.ts")
        runTsFile(
            checkFilePath,
            `
                import { expect } from "chai";
                import * as dataSourceResult from ${JSON.stringify(
                    getRelativeImportPath(
                        checkFilePath,
                        dataSourceFilePath,
                        "commonjs",
                    ),
                )};

                expect(dataSourceResult).to.haveOwnProperty("AppDataSource");
                expect(dataSourceResult.AppDataSource).to.haveOwnProperty("options");
                expect(dataSourceResult.AppDataSource.options).to.haveOwnProperty("entities");

                ${testCode}
            `,
        )
    }

    async function testContainedDataSourceFileWithArrayEntities(
        dataSourceCode: string,
    ) {
        const entityName = "User"
        await testContainedDataSourceFile(
            entityName,
            dataSourceCode,
            `
            const entities: any = dataSourceResult.AppDataSource.options.entities;
                expect(entities).to.be.an("array");
                expect(entities.length).to.be.gt(0);
                expect(entities[entities.length - 1].name).to.be.eq(${JSON.stringify(
                    entityName,
                )});
        `,
        )
    }

    async function testContainedDataSourceFileWithObjectEntities(
        dataSourceCode: string,
    ) {
        const entityName = "User"

        await testContainedDataSourceFile(
            entityName,
            dataSourceCode,
            `
            const entities: any = dataSourceResult.AppDataSource.options.entities;
            expect(entities).to.be.an("object");
            const entityNamesList: (string | undefined)[] = Object.values(entities).map((entity: any) => entity?.name);
            expect(entityNamesList.length).to.be.gt(0);
            expect(entityNamesList).to.include(${JSON.stringify(entityName)});
        `,
        )
    }

    async function testDataSourceFileWithLinkToEntitiesInOtherFile({
        dataSourceCode,
        files,
        testCode,
        entityName = "User",
    }: {
        dataSourceCode: string
        files: { path: string; content: string }[]
        testCode: string
        entityName?: string
    }) {
        const entitiesFolder = "entities"
        const dataSourceFile = "data-source.ts"
        const entityFile = entityName + ".ts"

        const dataSourceFilePath = path.join(testDir, dataSourceFile)
        writeFile(
            dataSourceFilePath,
            `
                import "reflect-metadata";
                import {DataSource} from ${JSON.stringify(
                    getRelativeImportPath(
                        dataSourceFilePath,
                        typeormLibraryPath,
                        "commonjs",
                    ),
                )};

                ${dataSourceCode}
            `,
        )

        for (const file of files)
            writeFile(path.join(testDir, file.path), file.content)

        await runCreateEntityCommand({
            dataSourceFilePath: dataSourceFile,
            entityPath: entitiesFolder + "/" + entityName,
        })

        // this is needed to make sure importing this file is successful in the
        // test environment, since importing "typeorm" inside a test would fail
        const entityFilePath = path.join(testDir, entitiesFolder, entityFile)
        writeFile(
            entityFilePath,
            `
                import { Entity, BaseEntity, PrimaryGeneratedColumn } from ${JSON.stringify(
                    getRelativeImportPath(
                        entityFilePath,
                        typeormLibraryPath,
                        "commonjs",
                    ),
                )};

                @Entity()
                export class ${entityName} extends BaseEntity {
                    @PrimaryGeneratedColumn()
                    id: number;
                }
            `,
        )

        const checkFilePath = path.join(testDir, "check.ts")
        runTsFile(
            checkFilePath,
            `
            import { expect } from "chai";
            import * as dataSourceResult from ${JSON.stringify(
                getRelativeImportPath(
                    checkFilePath,
                    dataSourceFilePath,
                    "commonjs",
                ),
            )};

            expect(dataSourceResult).to.haveOwnProperty("AppDataSource");
            expect(dataSourceResult.AppDataSource).to.haveOwnProperty("options");
            expect(dataSourceResult.AppDataSource.options).to.haveOwnProperty("entities");

            ${testCode}
            `,
        )
    }

    beforeEach(() => {
        if (fs.existsSync(testDir)) rmdirSync(testDir)
    })

    afterEach(() => {
        if (fs.existsSync(testDir)) rmdirSync(testDir)
    })

    describe("adds an import to the entity in data-source.ts when using entity:create - array", async () => {
        it("array literal expression", async () => {
            await testContainedDataSourceFileWithArrayEntities(`
                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db",
                    entities: []
                });
            `)
        })

        it("variable declaration", async () => {
            await testContainedDataSourceFileWithArrayEntities(`
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
            await testContainedDataSourceFileWithArrayEntities(`
                class Model {}

                const entities = [Model];

                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db",
                    entities
                });
            `)
        })
    })

    describe("adds an import to the entity in data-source.ts when using entity:create - object", async () => {
        it("object literal expression", async () => {
            await testContainedDataSourceFileWithObjectEntities(`
                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db",
                    entities: {}
                });
            `)
        })

        it("variable declaration", async () => {
            await testContainedDataSourceFileWithObjectEntities(`
                class Model {}

                const entities = {Model};

                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db",
                    entities: entities
                });
            `)
        })

        it("variable declaration - shorthand property assignment", async () => {
            await testContainedDataSourceFileWithObjectEntities(`
                class Model {}

                const entities = {Model};

                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db",
                    entities
                });
            `)
        })

        it("omitted", async () => {
            await testContainedDataSourceFileWithObjectEntities(`
                export const AppDataSource = new DataSource({
                    type: "sqlite",
                    database: "database.db"
                });
            `)
        })
    })

    describe("adds an import to the entity in external file used by data-source.ts when using entity:create", async () => {
        const entityName = "User"

        it("external file with exported list", async () => {
            await testDataSourceFileWithLinkToEntitiesInOtherFile({
                entityName,
                dataSourceCode: `
                    import { entities } from "./entities"

                    export const AppDataSource = new DataSource({
                        type: "sqlite",
                        database: "database.db",
                        entities: entities
                    });
                `,
                files: [
                    {
                        path: "entities.ts",
                        content: `
                            import { SomeModal } from "./entities/SomeModal";

                            export const entities = [
                                SomeModal
                            ];
                        `,
                    },
                    {
                        path: "entities/SomeModal.ts",
                        content: `
                            export class SomeModal {}
                        `,
                    },
                ],
                testCode: `
                    const entities: any = dataSourceResult.AppDataSource.options.entities;
                    expect(entities).to.be.an("array");
                    expect(entities.length).to.be.gt(0);
                    expect(entities[entities.length - 1].name).to.be.eq(${JSON.stringify(
                        entityName,
                    )});
                `,
            })
        })

        it("external file with exported list - shorthand property assignment", async () => {
            await testDataSourceFileWithLinkToEntitiesInOtherFile({
                entityName,
                dataSourceCode: `
                    import { entities } from "./entities"

                    export const AppDataSource = new DataSource({
                        type: "sqlite",
                        database: "database.db",
                        entities
                    });
                `,
                files: [
                    {
                        path: "entities.ts",
                        content: `
                            import { SomeModal } from "./entities/SomeModal";

                            export const entities = [
                                SomeModal
                            ];
                        `,
                    },
                    {
                        path: "entities/SomeModal.ts",
                        content: `
                            export class SomeModal {}
                        `,
                    },
                ],
                testCode: `
                    const entities: any = dataSourceResult.AppDataSource.options.entities;
                    expect(entities).to.be.an("array");
                    expect(entities.length).to.be.gt(0);
                    expect(entities[entities.length - 1].name).to.be.eq(${JSON.stringify(
                        entityName,
                    )});
                `,
            })
        })

        it("external file with exported object", async () => {
            await testDataSourceFileWithLinkToEntitiesInOtherFile({
                entityName,
                dataSourceCode: `
                    import { entities } from "./entities"

                    export const AppDataSource = new DataSource({
                        type: "sqlite",
                        database: "database.db",
                        entities: entities
                    });
                `,
                files: [
                    {
                        path: "entities.ts",
                        content: `
                            import { SomeModal } from "./entities/SomeModal";

                            export const entities = {
                                SomeModal
                            };
                        `,
                    },
                    {
                        path: "entities/SomeModal.ts",
                        content: `
                            export class SomeModal {}
                        `,
                    },
                ],
                testCode: `
                    const entities: any = dataSourceResult.AppDataSource.options.entities;
                    expect(entities).to.be.an("object");
                    const entityNamesList: (string | undefined)[] = Object.values(entities).map((entity: any) => entity?.name);
                    expect(entityNamesList.length).to.be.gt(0);
                    expect(entityNamesList).to.include(${JSON.stringify(
                        entityName,
                    )});
                `,
            })
        })

        it("external file with exported imports", async () => {
            await testDataSourceFileWithLinkToEntitiesInOtherFile({
                entityName,
                dataSourceCode: `
                    import * as entities from "./entities"

                    export const AppDataSource = new DataSource({
                        type: "sqlite",
                        database: "database.db",
                        entities: entities
                    });
                `,
                files: [
                    {
                        path: "entities.ts",
                        content: `
                            export { SomeModal } from "./entities/SomeModal";
                        `,
                    },
                    {
                        path: "entities/SomeModal.ts",
                        content: `
                            export class SomeModal {}
                        `,
                    },
                ],
                testCode: `
                    const entities: any = dataSourceResult.AppDataSource.options.entities;
                    expect(entities).to.be.an("object");
                    const entityNamesList: (string | undefined)[] = Object.values(entities).map((entity: any) => entity?.name);
                    expect(entityNamesList.length).to.be.gt(0);
                    expect(entityNamesList).to.include(${JSON.stringify(
                        entityName,
                    )});
                `,
            })
        })
    })
})
