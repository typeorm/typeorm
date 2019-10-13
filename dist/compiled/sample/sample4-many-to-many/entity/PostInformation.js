"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var PostInformation = /** @class */ (function () {
    function PostInformation() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostInformation.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostInformation.prototype, "text", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.informations; }, {
            cascade: ["update"],
        }),
        tslib_1.__metadata("design:type", Array)
    ], PostInformation.prototype, "posts", void 0);
    PostInformation = tslib_1.__decorate([
        index_1.Entity("sample4_post_information")
    ], PostInformation);
    return PostInformation;
}());
exports.PostInformation = PostInformation;
//# sourceMappingURL=PostInformation.js.map