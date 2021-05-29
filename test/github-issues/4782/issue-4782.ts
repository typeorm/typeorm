import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import { VersionUtils } from "../../../src/util/VersionUtils";

describe("github issues > #4782 mariadb driver wants to recreate create/update date columns CURRENT_TIMESTAMP(6) === current_timestamp(6)", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        // logging: true,
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "mariadb"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not want to execute migrations twice", () => Promise.all(connections.map(async connection => {
        const sql1 = await connection.driver.createSchemaBuilder().log();
        expect(sql1.upQueries).to.eql([]);
    })));

    describe("VersionUtils", () => {
        describe("isGreaterOrEqual", () => {
            it("should return false when comparing invalid versions", () => {
                expect(VersionUtils.isGreaterOrEqual("", "")).to.equal(false);
            });

            it("should return false when targetVersion is larger", () => {
                expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.2.4")).to.equal(false);
                expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.4.3")).to.equal(false);
                expect(VersionUtils.isGreaterOrEqual("1.2.3", "2.2.3")).to.equal(false);
                expect(VersionUtils.isGreaterOrEqual("1.2", "1.3")).to.equal(false);
                expect(VersionUtils.isGreaterOrEqual("1", "2")).to.equal(false);
                expect(VersionUtils.isGreaterOrEqual(undefined as unknown as string, "0.0.1")).to.equal(false);
            });

            it("should return true when targetVersion is smaller", () => {

                expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.2.2")).to.equal(true);
                expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.1.3")).to.equal(true);
                expect(VersionUtils.isGreaterOrEqual("1.2.3", "0.2.3")).to.equal(true);
                expect(VersionUtils.isGreaterOrEqual("1.2", "1.2")).to.equal(true);
                expect(VersionUtils.isGreaterOrEqual("1", "1")).to.equal(true);
            });

            it("should work with mariadb-style versions", () => {
                const dbVersion = "10.4.8-MariaDB-1:10.4.8+maria~bionic";
                expect(VersionUtils.isGreaterOrEqual("10.4.9", dbVersion)).to.equal(true);
                expect(VersionUtils.isGreaterOrEqual("10.4.8", dbVersion)).to.equal(true);
                expect(VersionUtils.isGreaterOrEqual("10.4.7", dbVersion)).to.equal(false);
            });
        });
    });

});
