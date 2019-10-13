"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var PostDetails = /** @class */ (function () {
    function PostDetails() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], PostDetails.prototype, "keyword", void 0);
    PostDetails = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostDetails);
    return PostDetails;
}());
exports.PostDetails = PostDetails;
//# sourceMappingURL=PostDetails.js.map