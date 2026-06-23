import { expect } from "chai";
import { TypeORMError } from "../../../../src/error";
import { OrmUtils } from "../../../../src/util/OrmUtils";

describe("OrmUtils.normalizeWhereCriteria", () => {
    it("should throw TypeORMError when options is undefined and value is null", () => {
        expect(() => OrmUtils.normalizeWhereCriteria({ key: null })).to.throw(TypeORMError);
    });

    it("should use default behavior when options is an empty object", () => {
        const result = OrmUtils.normalizeWhereCriteria({ key: null }, {});
        expect(result).to.deep.equal({});
    });
});