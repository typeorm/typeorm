import {expect} from "chai";
import { writeFileSync, unlinkSync } from "fs";
import { ConnectionOptionsReader } from "../../../src/connection/ConnectionOptionsReader";

describe("cli support for cjs extension", () => {
    it("will load a cjs file", async  () => {
        const databaseType = "postgres";
        const config = `module.exports = {"type": "${databaseType}"};`;
        const cjsConfigPath = [__dirname, "ormconfig.cjs"].join("/")
        writeFileSync(cjsConfigPath, config)

        const reader = new ConnectionOptionsReader({root: __dirname });

        const results = await reader.all();
        expect(results).to.be.an("Array");
        expect(results[0]).to.be.an("Object");
        expect(results[0].type).to.equal(databaseType);

        unlinkSync(cjsConfigPath);
    });
});
