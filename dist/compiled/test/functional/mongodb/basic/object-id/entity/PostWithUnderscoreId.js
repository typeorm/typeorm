"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ObjectIdColumn_1 = require("../../../../../../src/decorator/columns/ObjectIdColumn");
var typings_1 = require("../../../../../../src/driver/mongodb/typings");
var PostWithUnderscoreId = /** @class */ (function () {
    function PostWithUnderscoreId() {
    }
    tslib_1.__decorate([
        ObjectIdColumn_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", typings_1.ObjectID)
    ], PostWithUnderscoreId.prototype, "_id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostWithUnderscoreId.prototype, "title", void 0);
    PostWithUnderscoreId = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostWithUnderscoreId);
    return PostWithUnderscoreId;
}());
exports.PostWithUnderscoreId = PostWithUnderscoreId;
//# sourceMappingURL=PostWithUnderscoreId.js.map