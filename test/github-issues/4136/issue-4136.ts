import { strict as assert } from "assert"
import sinon from "sinon"
import fs from "fs"
import * as path from "path"
import { importOrRequireFile } from "../../../src/util/ImportUtils"

describe("getNearestPackageJson with caching", () => {
    let statStub: sinon.SinonStub
    let readFileStub: sinon.SinonStub

    beforeEach(() => {
        statStub = sinon.stub(fs.promises, "stat")
        readFileStub = sinon.stub(fs.promises, "readFile")
    })

    afterEach(() => {
        sinon.restore()
    })

    it("Should use cache to find package.json", async () => {
        assert.equal(
            statStub.callCount,
            0,
            "stat should not be called before importOrRequireFile",
        )
        assert.equal(
            readFileStub.callCount,
            0,
            "readFile should not be called before importOrRequireFile",
        )

        const filePath1 = path.join(__dirname, "file1.js")
        const filePath2 = path.join(__dirname, "file2.js")
        const filePath3 = path.join(__dirname, "file3.js")

        // Trigger the first import to create the cache
        await importOrRequireFile(filePath1)

        // Get the number of calls to stat and readFile after the first import
        const numberOfStatCalls = statStub.callCount
        const numberOfReadFileCalls = readFileStub.callCount

        // Trigger next imports to check if cache is used
        await importOrRequireFile(filePath2)
        await importOrRequireFile(filePath3)

        assert.equal(
            statStub.callCount,
            numberOfStatCalls,
            "stat should be called only during the first import",
        )
        assert.equal(
            readFileStub.callCount,
            numberOfReadFileCalls,
            "readFile should be called only during the first import",
        )
    })
})
