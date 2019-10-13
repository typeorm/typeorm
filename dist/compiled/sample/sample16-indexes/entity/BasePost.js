"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Index_1 = require("../../../src/decorator/Index");
var BasePost = /** @class */ (function () {
    function BasePost() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], BasePost.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column({ unique: true }),
        tslib_1.__metadata("design:type", String)
    ], BasePost.prototype, "text", void 0);
    tslib_1.__decorate([
        Index_1.Index(),
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], BasePost.prototype, "extra", void 0);
    BasePost = tslib_1.__decorate([
        Index_1.Index("my_index_with_id_and_text", ["id", "text"])
    ], BasePost);
    return BasePost;
}());
exports.BasePost = BasePost;
//# sourceMappingURL=BasePost.js.map