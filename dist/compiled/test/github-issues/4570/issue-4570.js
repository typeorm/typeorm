"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var src_1 = require("../../../src");
describe("github issues > #4570 Fix PrimaryColumn decorator modifies passed option", function () {
    it("should not modify passed options to PrimaryColumn", function () {
        var options = { type: "varchar" };
        var clone = Object.assign({}, options);
        var Entity = /** @class */ (function () {
            function Entity() {
            }
            tslib_1.__decorate([
                src_1.PrimaryColumn(options),
                tslib_1.__metadata("design:type", String)
            ], Entity.prototype, "pkey", void 0);
            return Entity;
        }());
        chai_1.expect(Entity).to.be;
        chai_1.expect(clone).to.be.eql(options);
    });
});
//# sourceMappingURL=issue-4570.js.map