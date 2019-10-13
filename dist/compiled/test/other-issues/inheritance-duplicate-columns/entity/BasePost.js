"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var BaseContent_1 = require("./BaseContent");
var BasePost = /** @class */ (function (_super) {
    tslib_1.__extends(BasePost, _super);
    function BasePost() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], BasePost.prototype, "id", void 0);
    return BasePost;
}(BaseContent_1.BaseContent));
exports.BasePost = BasePost;
//# sourceMappingURL=BasePost.js.map