"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var PostMetadata = /** @class */ (function () {
    function PostMetadata() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostMetadata.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], PostMetadata.prototype, "comment", void 0);
    PostMetadata = tslib_1.__decorate([
        index_1.Entity("sample19_post_metadata")
    ], PostMetadata);
    return PostMetadata;
}());
exports.PostMetadata = PostMetadata;
//# sourceMappingURL=PostMetadata.js.map