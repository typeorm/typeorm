import "reflect-metadata";
import { setupConnection } from "../../utils/test-utils";
import { User } from "./entity/User";
import { expect } from "chai";

describe("github issues > #1139 mysql primary generated uuid ER_TOO_LONG_KEY", () => {
    it('correctly create primary generated uuid column', () => {
      expect(setupConnection((connection) => {
        connection.synchronize(true);
      }, [ User ])).to.not.throw();
    });
});
