"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var PostDetails = /** @class */ (function () {
    function PostDetails() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostDetails.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column({
            type: String,
            nullable: true
        }),
        tslib_1.__metadata("design:type", Object)
    ], PostDetails.prototype, "authorName", void 0);
    tslib_1.__decorate([
        index_1.Column({
            type: String,
            nullable: true
        }),
        tslib_1.__metadata("design:type", Object)
    ], PostDetails.prototype, "comment", void 0);
    tslib_1.__decorate([
        index_1.Column({
            type: String,
            nullable: true
        }),
        tslib_1.__metadata("design:type", Object)
    ], PostDetails.prototype, "metadata", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.details; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], PostDetails.prototype, "posts", void 0);
    PostDetails = tslib_1.__decorate([
        index_1.Entity("sample4_post_details")
    ], PostDetails);
    return PostDetails;
}());
exports.PostDetails = PostDetails;
//# sourceMappingURL=PostDetails.js.map