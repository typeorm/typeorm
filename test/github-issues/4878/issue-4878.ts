import { DriverUtils } from "../../../src/driver/DriverUtils";
import { expect } from "chai";

describe("github issues > #4878 URL Connection string not overridden by supplied options", () => {
    it("should override url-built options with user-supplied options", () => {
        const obj: any = {
            username: "user",
            password: "password",
            host: "host",
            database: "database",
            port: 8888
        };

        const url = `postgres://url_user:${obj.password}@${obj.host}:${obj.port}/${obj.database}`;
        obj.url = url;
        const options = DriverUtils.buildDriverOptions(obj);
        expect(options.username).to.eql(obj.username);
    });
});
