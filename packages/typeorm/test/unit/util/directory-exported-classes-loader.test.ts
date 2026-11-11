import { expect } from "chai"
import fs from "fs/promises"
import path from "path"
import { AdvancedConsoleLogger } from "../../../src/logger/AdvancedConsoleLogger"
import { importClassesFromDirectories } from "../../../src/util/DirectoryExportedClassesLoader"

describe("DirectoryExportedClassesLoader", () => {
    let directory: string
    const logger = new AdvancedConsoleLogger(false)

    beforeEach(async () => {
        directory = await fs.mkdtemp(path.join(__dirname, "typeorm-loader-"))
    })

    afterEach(async () => {
        await fs.rm(directory, { recursive: true, force: true })
    })

    it("passes absolute paths to the loader and collects module exports", async () => {
        class Entity {}
        class DefaultEntity {}
        const file = path.join(directory, "entity.ts")
        await fs.writeFile(file, "not valid JavaScript")
        await fs.writeFile(path.join(directory, "entity.d.ts"), "declaration")
        const paths: string[] = []

        const classes = await importClassesFromDirectories(
            logger,
            [path.join(directory, "*.ts")],
            undefined,
            async (filePath) => {
                paths.push(filePath)
                return { Entity, default: DefaultEntity }
            },
        )

        expect(paths).to.deep.equal([file])
        expect(classes).to.deep.equal([Entity, DefaultEntity])
    })

    it("propagates loader errors without retrying native loading", async () => {
        const file = path.join(directory, "entity.js")
        await fs.writeFile(file, "module.exports = class Entity {}")
        const error = new Error("transform failed")
        let calls = 0
        try {
            await importClassesFromDirectories(
                logger,
                [file],
                undefined,
                async () => {
                    calls++
                    throw error
                },
            )
            expect.fail("Expected the loader error")
        } catch (caught) {
            expect(caught).to.equal(error)
        }
        expect(calls).to.equal(1)
    })

    it("keeps native loading when no loader is configured", async () => {
        const file = path.join(directory, "entity.cjs")
        await fs.writeFile(file, "module.exports = class Entity {}")
        const classes = await importClassesFromDirectories(logger, [file])
        expect(classes).to.have.length(1)
        expect(classes[0].name).to.equal("Entity")
    })
})
